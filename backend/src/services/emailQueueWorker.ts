import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma';
import { sendEmail } from './emailService';
import { logInfo, logError } from '../utils/logger';

const BACKOFF_DELAYS = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
];

const BATCH_SIZE = 10;
const POLL_INTERVAL = '*/30 * * * * *';

let scheduledJob: ScheduledTask | null = null;
let isProcessing = false;

export function initializeEmailWorker(): void {
  logInfo('Initializing email queue worker...');

  scheduledJob = cron.schedule(POLL_INTERVAL, async () => {
    await processQueue();
  });

  logInfo('Email queue worker initialized (polling every 30 seconds)');
}

export function stopEmailWorker(): void {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    logInfo('Email queue worker stopped');
  }
}

async function processQueue(): Promise<void> {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const jobs = await prisma.emailQueue.findMany({
      where: {
        status: 'pending',
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: BATCH_SIZE,
    });

    for (const job of jobs) {
      await processJob(job);
    }
  } catch (error) {
    logError(error instanceof Error ? error : 'Error processing email queue');
  } finally {
    isProcessing = false;
  }
}

async function processJob(
  job: Awaited<ReturnType<typeof prisma.emailQueue.findUnique>> & { id: string },
): Promise<void> {
  try {
    await prisma.emailQueue.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    const options: Parameters<typeof sendEmail>[0] = {
      to: job.recipientEmail,
      subject: job.subject,
      html: job.htmlContent,
      text: job.textContent,
    };

    if (job.attachmentPath && job.attachmentFilename) {
      options.attachments = [
        {
          filename: job.attachmentFilename,
          path: job.attachmentPath,
        },
      ];
    }

    const result = await sendEmail(options);

    if (result.success) {
      await prisma.$transaction(async (tx) => {
        await tx.emailQueue.update({
          where: { id: job.id },
          data: {
            status: 'sent',
            processedAt: new Date(),
            sentAt: new Date(),
          },
        });

        await tx.receipt.update({
          where: { id: job.receiptId },
          data: {
            emailedAt: new Date(),
            emailRecipient: job.recipientEmail,
            emailStatus: 'sent',
            emailAttempts: { increment: 1 },
          },
        });
      });

      logInfo(`Email sent successfully for receipt ${job.receiptId} (job ${job.id})`);
    } else {
      const newAttempts = job.attempts + 1;
      const errorMessage = result.error ?? 'Unknown error';

      if (newAttempts >= job.maxAttempts) {
        await prisma.$transaction(async (tx) => {
          await tx.emailQueue.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              attempts: newAttempts,
              lastError: errorMessage,
              processedAt: new Date(),
            },
          });

          await tx.receipt.update({
            where: { id: job.receiptId },
            data: {
              emailStatus: 'failed',
              emailErrorMessage: errorMessage,
              emailAttempts: { increment: 1 },
            },
          });
        });

        logError(`Email job ${job.id} failed permanently after ${newAttempts} attempts: ${errorMessage}`);
      } else {
        const backoffIndex = Math.min(newAttempts - 1, BACKOFF_DELAYS.length - 1);
        const nextAttemptAt = new Date(Date.now() + BACKOFF_DELAYS[backoffIndex]);

        await prisma.$transaction(async (tx) => {
          await tx.emailQueue.update({
            where: { id: job.id },
            data: {
              status: 'pending',
              attempts: newAttempts,
              nextAttemptAt,
              lastError: errorMessage,
            },
          });

          await tx.receipt.update({
            where: { id: job.receiptId },
            data: {
              emailAttempts: { increment: 1 },
              emailErrorMessage: errorMessage,
            },
          });
        });

        logInfo(`Email job ${job.id} failed (attempt ${newAttempts}/${job.maxAttempts}), retrying at ${nextAttemptAt.toISOString()}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    logError(`Unexpected error processing email job ${job.id}: ${errorMessage}`);

    try {
      await prisma.emailQueue.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          lastError: errorMessage,
          processedAt: new Date(),
        },
      });
    } catch (updateError) {
      logError(`Failed to update email job ${job.id} after unexpected error`);
    }
  }
}

export default { initializeEmailWorker, stopEmailWorker };
