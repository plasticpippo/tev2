import { receiptQueueService } from '../services/receiptQueueService';

const INTERVAL_MS = parseInt(process.env.RECEIPT_WORKER_INTERVAL_MS || '30000', 10);

let running = false;
let inProgress = false;
let stopRequested = false;

function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[ReceiptWorker ${timestamp}] ${message}`, data);
  } else {
    console.log(`[ReceiptWorker ${timestamp}] ${message}`);
  }
}

function logError(message: string, error: unknown) {
  const timestamp = new Date().toISOString();
  console.error(`[ReceiptWorker ${timestamp}] ERROR: ${message}`, error);
}

async function simulateReceiptGeneration(): Promise<boolean> {
  return Math.random() > 0.3;
}

async function processQueueItem() {
  const item = await receiptQueueService.getNextPending();

  if (!item) {
    return false;
  }

  log('Processing queue item', { queueId: item.id, receiptId: item.receiptId, attempts: item.attempts });

  await receiptQueueService.markProcessing(item.id);

  try {
    const success = await simulateReceiptGeneration();

    if (success) {
      await receiptQueueService.markCompleted(item.id);
      log('Queue item completed', { queueId: item.id, receiptId: item.receiptId });
    } else {
      await receiptQueueService.markFailed(item.id, 'Simulated generation failure');
      log('Queue item failed, will retry', { queueId: item.id, receiptId: item.receiptId });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await receiptQueueService.markFailed(item.id, errorMessage);
    logError('Queue item processing error', { queueId: item.id, error: errorMessage });
  }

  return true;
}

async function workerLoop() {
  while (running) {
    if (stopRequested) {
      log('Stop requested, exiting loop');
      break;
    }

    try {
      inProgress = true;
      await processQueueItem();
      inProgress = false;
    } catch (error) {
      inProgress = false;
      logError('Unexpected error in worker loop', error);
    }

    if (!stopRequested) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
    }
  }
}

export async function startWorker(): Promise<void> {
  if (running) {
    log('Worker already running');
    return;
  }

  running = true;
  stopRequested = false;
  log('Worker starting', { intervalMs: INTERVAL_MS });

  workerLoop().catch((error) => {
    logError('Worker loop crashed', error);
  });
}

export async function stopWorker(): Promise<void> {
  if (!running) {
    log('Worker not running');
    return;
  }

  stopRequested = true;
  log('Stop requested, waiting for in-progress item to complete');

  while (inProgress) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  running = false;
  log('Worker stopped');
}

function setupSignalHandlers() {
  const shutdown = async () => {
    log('Shutdown signal received');
    await stopWorker();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

setupSignalHandlers();
