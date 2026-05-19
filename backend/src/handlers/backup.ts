import { Router, Request, Response } from 'express';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { backupUpload } from '../middleware/upload';
import { logError, logInfo } from '../utils/logger';
import { prisma } from '../prisma';
import '../types';

const execAsync = promisify(exec);
export const backupRouter = Router();

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');
const BACKUP_SCRIPT = path.join(SCRIPTS_DIR, 'backup.sh');
const RESTORE_SCRIPT = path.join(SCRIPTS_DIR, 'restore-cloud.sh');
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

const SIDECAR_URL = process.env.MEGA_SIDECAR_URL || 'http://mega-sidecar:3002';

const sidecarFetch = async (pathInput: string, options?: RequestInit) => {
  const url = `${SIDECAR_URL}${pathInput}`;
  const apiKey = process.env.MEGA_SIDECAR_API_KEY;
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  if (options?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
};

type JobStatus = 'pending' | 'running' | 'success' | 'failed';

interface BackupJob {
  id: string;
  type: 'backup' | 'restore';
  status: JobStatus;
  output: string[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

const jobs = new Map<string, BackupJob>();

const JOB_TTL_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if ((job.status === 'success' || job.status === 'failed') && job.completedAt) {
      const age = now - job.completedAt.getTime();
      if (age > JOB_TTL_MS) {
        jobs.delete(id);
      }
    }
  }
}, 5 * 60 * 1000);

const generateJobId = (): string => {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createJob = (type: 'backup' | 'restore'): BackupJob => {
  const job: BackupJob = {
    id: generateJobId(),
    type,
    status: 'pending',
    output: [],
    startedAt: new Date(),
  };
  jobs.set(job.id, job);
  return job;
};

const updateJobStatus = (jobId: string, status: JobStatus, output?: string, error?: string) => {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    if (output) job.output.push(output);
    if (error) job.error = error;
    if (status === 'success' || status === 'failed') {
      job.completedAt = new Date();
    }
  }
};

const runScript = async (
  script: string,
  args: string[],
  jobId: string
): Promise<{ success: boolean; output: string; error?: string }> => {
  return new Promise((resolve) => {
    updateJobStatus(jobId, 'running');

    const child = spawn(script, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      updateJobStatus(jobId, 'running', text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      updateJobStatus(jobId, 'running', text);
    });

    child.on('close', (code) => {
      const success = code === 0;
      if (success) {
        updateJobStatus(jobId, 'success', 'Process completed successfully');
      } else {
        updateJobStatus(jobId, 'failed', undefined, `Process exited with code ${code}`);
      }
      resolve({ success, output: stdout, error: stderr || `Exit code: ${code}` });
    });

    child.on('error', (err) => {
      updateJobStatus(jobId, 'failed', undefined, err.message);
      resolve({ success: false, output: '', error: err.message });
    });
  });
};

const getScheduleData = async () => {
  try {
    const { stdout } = await execAsync('crontab -l');
    const lines = stdout.trim().split('\n');
    const backupLine = lines.find(line => line.includes('TEV2-cloud-backup'));
    if (!backupLine) {
      return { enabled: false, hour: 4, compress: false };
    }
    const parts = backupLine.trim().split(/\s+/);
    const hour = parseInt(parts[1], 10);
    const compress = backupLine.includes('--compress');
    return { enabled: true, hour: isNaN(hour) ? 4 : hour, compress };
  } catch {
    return { enabled: false, hour: 4, compress: false };
  }
};

const updateSchedule = async (enabled: boolean, hour: number, compress: boolean) => {
  if (typeof enabled !== 'boolean') {
    throw new Error('enabled must be a boolean');
  }
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error('hour must be an integer between 0 and 23');
  }
  if (typeof compress !== 'boolean') {
    throw new Error('compress must be a boolean');
  }

  const { stdout: currentCrontab } = await execAsync('crontab -l 2>/dev/null || true');
  const lines = currentCrontab.trim().split('\n').filter(line => !line.includes('TEV2-cloud-backup'));

  if (enabled) {
    const compressFlag = compress ? '--compress' : '';
    const backupLine = `0 ${hour} * * * bash ${SCRIPTS_DIR}/backup.sh --cloud ${compressFlag} # TEV2-cloud-backup`;
    lines.push(backupLine);
  }

  const newCrontab = lines.join('\n');
  const tmpFile = path.join(os.tmpdir(), `crontab_${Date.now()}`);
  await fs.writeFile(tmpFile, newCrontab, { mode: 0o600 });
  await execAsync(`crontab ${tmpFile}`);
  await fs.unlink(tmpFile);
};

backupRouter.get('/cloud/status', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  try {
    const response = await sidecarFetch('/status');
    if (!response.ok) {
      throw new Error(`Sidecar returned ${response.status}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Failed to check cloud backup status', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    res.json({ installed: false, loggedIn: false, email: null });
  }
});

backupRouter.post('/cloud/install', authenticateToken, requirePermission('settings:manage'), async (_req: Request, res: Response) => {
  const job = createJob('backup');
  updateJobStatus(job.id, 'success', 'MEGA CMD is pre-installed in the sidecar container');
  res.json({ jobId: job.id });
});

backupRouter.post('/cloud/login', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: t('errors.backup.emailAndPasswordRequired') });
  }
  try {
    const response = await sidecarFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || t('errors.backup.loginFailed'));
    }
    const data = await response.json();

    const jobId = generateJobId();
    jobs.set(jobId, {
      id: jobId,
      type: 'backup',
      status: 'running',
      output: [],
      startedAt: new Date(),
    });

    const pollSidecarJob = async (sidecarJobId: string, retries = 0) => {
      if (retries >= 30) {
        updateJobStatus(jobId, 'failed', undefined, 'Login timed out');
        return;
      }
      try {
        const statusRes = await sidecarFetch(`/jobs/${sidecarJobId}`);
        if (statusRes.ok) {
          const sidecarJob = await statusRes.json();
          if (sidecarJob.status === 'success') {
            updateJobStatus(jobId, 'success', 'Login successful');
            return;
          } else if (sidecarJob.status === 'failed') {
            updateJobStatus(jobId, 'failed', undefined, sidecarJob.error || 'Login failed');
            return;
          }
        }
      } catch { /* retry */ }
      setTimeout(() => pollSidecarJob(sidecarJobId, retries + 1), 2000);
    };

    pollSidecarJob(data.jobId);
    res.json({ jobId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('MEGA login failed', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    res.status(500).json({ error: t('errors.backup.loginFailed') });
  }
});

backupRouter.post('/cloud/logout', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  try {
    await sidecarFetch('/logout', { method: 'POST' });
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

backupRouter.post('/local', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({ error: t('errors.settings.databaseConfigNotFound') });
    }

    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

    if (!urlMatch) {
      return res.status(500).json({ error: t('errors.settings.invalidDatabaseConfig') });
    }

    const [, user, password, host, port, database] = urlMatch;

    const sanitizeParam = (param: string, name: string): string | null => {
      if (!param || !/^[a-zA-Z0-9_.-]+$/.test(param)) {
        return null;
      }
      return param;
    };

    const safeUser = sanitizeParam(user, 'username');
    const safeHost = sanitizeParam(host, 'host');
    const safePort = sanitizeParam(port, 'port');
    const safeDatabase = sanitizeParam(database, 'database');

    if (!safeUser || !safeHost || !safePort || !safeDatabase) {
      return res.status(500).json({ error: t('errors.settings.invalidDatabaseConfig') });
    }

    const env = { ...process.env, PGPASSWORD: password };

    const pgDumpArgs = [
      '-h', safeHost,
      '-p', safePort,
      '-U', safeUser,
      '-d', safeDatabase,
      '--format=p',
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges'
    ];

    const { stdout, stderr, exitCode } = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
      const pgDump = spawn('pg_dump', pgDumpArgs, { env });

      let stdout = '';
      let stderr = '';

      pgDump.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pgDump.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pgDump.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      });

      pgDump.on('error', (err) => {
        reject(err);
      });
    });

    if (exitCode !== 0) {
      logError(`pg_dump failed with exit code ${exitCode}: ${stderr}`, { correlationId: (req as any).correlationId });
      return res.status(500).json({ error: t('errors.settings.backupFailed') });
    }

    logInfo('Database backup created successfully', { correlationId: (req as any).correlationId });

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=database_backup.sql');
    res.send(stdout);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(errorMessage, {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors.settings.backupFailed') });
  }
});

backupRouter.post('/local/full', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);

  let stagingDir: string | null = null;
  let dumpPath: string | null = null;
  let archivePath: string | null = null;

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ error: t('errors.settings.databaseConfigNotFound') });
    }

    const dbConfig = parseDatabaseUrl(databaseUrl);
    if (!dbConfig) {
      return res.status(500).json({ error: t('errors.settings.invalidDatabaseConfig') });
    }

    const { user, password, host, port, database } = dbConfig;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
    const archiveName = `tev2_full_${timestamp}.tar.gz`;
    const backupDir = BACKUPS_DIR;
    await fs.mkdir(backupDir, { recursive: true });

    dumpPath = path.join(backupDir, `db_backup_${timestamp}.sql`);
    stagingDir = path.join(backupDir, `_full_staging_${timestamp}`);

    const env = { ...process.env, PGPASSWORD: password };
    const pgDumpArgs = [
      '-h', host, '-p', port, '-U', user, '-d', database,
      '--format=p', '--clean', '--if-exists', '--no-owner', '--no-privileges',
    ];

    const dumpResult = await new Promise<{ exitCode: number; stderr: string }>((resolve, reject) => {
      const pgDump = spawn('pg_dump', pgDumpArgs, { env });
      const dumpStream = require('fs').createWriteStream(dumpPath!);
      let stderr = '';
      pgDump.stdout.pipe(dumpStream);
      pgDump.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      pgDump.on('close', (code: number | null) => resolve({ exitCode: code ?? 1, stderr }));
      pgDump.on('error', reject);
    });

    if (dumpResult.exitCode !== 0) {
      logError(`pg_dump failed with exit code ${dumpResult.exitCode}: ${dumpResult.stderr}`, { correlationId: (req as any).correlationId });
      return res.status(500).json({ error: t('errors.settings.backupFailed') });
    }

    await fs.rm(stagingDir, { recursive: true, force: true });
    await fs.mkdir(path.join(stagingDir, 'database'), { recursive: true });
    await fs.mkdir(path.join(stagingDir, 'volumes'), { recursive: true });
    await fs.mkdir(path.join(stagingDir, 'config'), { recursive: true });

    await fs.copyFile(dumpPath, path.join(stagingDir, 'database', path.basename(dumpPath)));
    await fs.unlink(dumpPath);
    dumpPath = null;

    try { await execAsync(`tar czf ${path.join(stagingDir, 'volumes', 'storage_data.tar.gz')} -C /app/storage .`); } catch { /* empty volume */ }
    try { await execAsync(`tar czf ${path.join(stagingDir, 'volumes', 'uploads_data.tar.gz')} -C /app/uploads .`); } catch { /* empty volume */ }

    try { await fs.copyFile('/app/.env', path.join(stagingDir, 'config', '.env')); } catch { /* no .env */ }
    try { await fs.copyFile('/app/VERSION', path.join(stagingDir, 'config', 'VERSION')); } catch { /* no VERSION */ }

    const manifest = [
      'TEV2 Full Backup Archive',
      `Created: ${new Date().toISOString()}`,
      `Database: ${database}`,
      'Contents:',
      '  database/   - PostgreSQL dump file',
      '  volumes/    - Docker volume exports (storage_data, uploads_data)',
      '  config/     - .env and VERSION files',
    ].join('\n');
    await fs.writeFile(path.join(stagingDir, 'MANIFEST.txt'), manifest);

    archivePath = path.join(backupDir, archiveName);
    await execAsync(`tar czf ${archivePath} -C ${stagingDir} .`);

    const stats = await fs.stat(archivePath);
    const fileStream = require('fs').createReadStream(archivePath);
    
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename=${archiveName}`);
    res.setHeader('Content-Length', stats.size);

    fileStream.pipe(res);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Full backup failed', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: t('errors.settings.backupFailed') });
    }
  } finally {
    try {
      if (dumpPath) await fs.unlink(dumpPath);
    } catch { /* ignore */ }
    try {
      if (stagingDir) await fs.rm(stagingDir, { recursive: true, force: true });
    } catch { /* ignore */ }
    try {
      if (archivePath) await fs.unlink(archivePath);
    } catch { /* ignore */ }
  }
});

const DEFAULT_RETENTION = 30;

const getRetention = async (): Promise<number> => {
  try {
    const settings = await prisma.settings.findFirst();
    return settings?.cloudBackupRetention || DEFAULT_RETENTION;
  } catch {
    return DEFAULT_RETENTION;
  }
};

const parseBackupDate = (filename: string): number | null => {
  // filename format: tev2_full_YYYYMMDD_HHMMSS.tar.gz
  const match = filename.match(/^tev2_full_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.tar\.gz$/);
  if (!match) return null;
  const [, year, month, day, hour, min, sec] = match;
  const date = new Date(
    parseInt(year), parseInt(month) - 1, parseInt(day),
    parseInt(hour), parseInt(min), parseInt(sec)
  );
  return date.getTime();
};

const parseDatabaseUrl = (databaseUrl: string): { user: string; password: string; host: string; port: string; database: string } | null => {
  const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!urlMatch) return null;

  const [, user, password, host, port, database] = urlMatch;

  const sanitizeParam = (param: string): string | null => {
    if (!param || !/^[a-zA-Z0-9_.-]+$/.test(param)) {
      return null;
    }
    return param;
  };

  const safeUser = sanitizeParam(user);
  const safeHost = sanitizeParam(host);
  const safePort = sanitizeParam(port);
  const safeDatabase = sanitizeParam(database);

  if (!safeUser || !safeHost || !safePort || !safeDatabase) {
    return null;
  }

  return { user: safeUser, password, host: safeHost, port: safePort, database: safeDatabase };
};

const enforceRetentionPolicy = async () => {
  try {
    const retention = await getRetention();
    const cutoff = Date.now() - retention * 86400000;
    const listRes = await sidecarFetch('/list?path=/TEV2/backups');
    if (!listRes.ok) return;
    const data = await listRes.json();
    const backups = (data.files || [])
      .filter((f: any) => f.name && f.name.startsWith('tev2_full_') && f.name.endsWith('.tar.gz'));

    const toDelete = backups.filter((b: any) => {
      const ts = parseBackupDate(b.name);
      return ts !== null && ts < cutoff;
    });
    for (const backup of toDelete) {
      try {
        await sidecarFetch('/rm', {
          method: 'POST',
          body: JSON.stringify({ path: `/TEV2/backups/${backup.name}` }),
        });
      } catch { /* ignore individual deletion failures */ }
    }
  } catch { /* ignore retention enforcement failures */ }
};

backupRouter.post('/cloud', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const { compress = true } = req.body;

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ error: t('errors.settings.databaseConfigNotFound') });
    }

    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!urlMatch) {
      return res.status(500).json({ error: t('errors.settings.invalidDatabaseConfig') });
    }

    const [, user, password, host, port, database] = urlMatch;
    const job = createJob('backup');

    (async () => {
      try {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timestamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
        const archiveName = `tev2_full_${timestamp}.tar.gz`;
        const backupDir = BACKUPS_DIR;
        await fs.mkdir(backupDir, { recursive: true });

        const dumpPath = path.join(backupDir, `db_backup_${timestamp}.sql`);

        updateJobStatus(job.id, 'running', 'Creating database dump...');

        const env = { ...process.env, PGPASSWORD: password };
        const pgDumpArgs = [
          '-h', host, '-p', port, '-U', user, '-d', database,
          '--format=p', '--clean', '--if-exists', '--no-owner', '--no-privileges',
        ];

        const dumpResult = await new Promise<{ exitCode: number; stderr: string }>((resolve, reject) => {
          const pgDump = spawn('pg_dump', pgDumpArgs, { env });
          const dumpStream = require('fs').createWriteStream(dumpPath);
          let stderr = '';
          pgDump.stdout.pipe(dumpStream);
          pgDump.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
          pgDump.on('close', (code: number | null) => resolve({ exitCode: code ?? 1, stderr }));
          pgDump.on('error', reject);
        });

        if (dumpResult.exitCode !== 0) {
          updateJobStatus(job.id, 'failed', undefined, `pg_dump failed: ${dumpResult.stderr}`);
          return;
        }

        updateJobStatus(job.id, 'running', 'Creating archive...');

        const stagingDir = path.join(backupDir, '_cloud_staging');
        await fs.rm(stagingDir, { recursive: true, force: true });
        await fs.mkdir(path.join(stagingDir, 'database'), { recursive: true });
        await fs.mkdir(path.join(stagingDir, 'volumes'), { recursive: true });
        await fs.mkdir(path.join(stagingDir, 'config'), { recursive: true });

        await fs.copyFile(dumpPath, path.join(stagingDir, 'database', path.basename(dumpPath)));
        await fs.unlink(dumpPath);

        try { await execAsync(`tar czf ${path.join(stagingDir, 'volumes', 'storage_data.tar.gz')} -C /app/storage .`); } catch { /* empty volume */ }
        try { await execAsync(`tar czf ${path.join(stagingDir, 'volumes', 'uploads_data.tar.gz')} -C /app/uploads .`); } catch { /* empty volume */ }

        try { await fs.copyFile('/app/.env', path.join(stagingDir, 'config', '.env')); } catch { /* no .env */ }
        try { await fs.copyFile('/app/VERSION', path.join(stagingDir, 'config', 'VERSION')); } catch { /* no VERSION */ }

        const manifest = [
          'TEV2 Cloud Backup Archive',
          `Created: ${new Date().toISOString()}`,
          `Database: ${database}`,
          `DB Backup: ${path.basename(dumpPath)}`,
          'Contents:',
          '  database/   - PostgreSQL dump file',
          '  volumes/    - Docker volume exports (storage_data, uploads_data)',
          '  config/     - .env and VERSION files',
        ].join('\n');
        await fs.writeFile(path.join(stagingDir, 'MANIFEST.txt'), manifest);

        const archivePath = path.join(backupDir, archiveName);
        await execAsync(`tar czf ${archivePath} -C ${stagingDir} .`);
        await fs.rm(stagingDir, { recursive: true, force: true });

        const sidecarLocalPath = `/backups/${archiveName}`;
        const remotePath = '/TEV2/backups';

        updateJobStatus(job.id, 'running', 'Ensuring MEGA folder exists...');
        await sidecarFetch('/mkdir', {
          method: 'POST',
          body: JSON.stringify({ path: '/TEV2' }),
        });
        await sidecarFetch('/mkdir', {
          method: 'POST',
          body: JSON.stringify({ path: remotePath }),
        });

        updateJobStatus(job.id, 'running', 'Uploading to MEGA...');

        const uploadRes = await sidecarFetch('/upload', {
          method: 'POST',
          body: JSON.stringify({ localPath: sidecarLocalPath, remotePath }),
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Upload request failed');
        }

        const uploadData = await uploadRes.json();

        const pollUpload = async (retries = 0) => {
          if (retries >= 60) {
            updateJobStatus(job.id, 'failed', undefined, 'Upload timed out');
            return;
          }
          try {
            const statusRes = await sidecarFetch(`/jobs/${uploadData.jobId}`);
            if (statusRes.ok) {
              const uploadJob = await statusRes.json();
              updateJobStatus(job.id, 'running', `Upload: ${uploadJob.status}`);
              if (uploadJob.status === 'success') {
                try { await fs.unlink(archivePath); } catch { /* ignore */ }
                updateJobStatus(job.id, 'success', 'Cloud backup completed successfully');
                enforceRetentionPolicy();
                return;
              } else if (uploadJob.status === 'failed') {
                updateJobStatus(job.id, 'failed', undefined, uploadJob.error || 'Upload failed');
                return;
              }
            }
          } catch { /* retry */ }
          setTimeout(() => pollUpload(retries + 1), 3000);
        };

        pollUpload();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        updateJobStatus(job.id, 'failed', undefined, errMsg);
      }
    })();

    res.json({ jobId: job.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Cloud backup failed to start', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    res.status(500).json({ error: t('errors.backup.cloudBackupStartFailed') });
  }
});

backupRouter.get('/cloud/jobs/:id', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const job = jobs.get(id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    type: job.type,
    status: job.status,
    output: job.output,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
  });
});

backupRouter.get('/cloud/list', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const response = await sidecarFetch('/list?path=/TEV2/backups');
    if (!response.ok) {
      throw new Error(`Sidecar returned ${response.status}`);
    }
    const data = await response.json();

    const backups = (data.files || [])
      .filter((f: any) => f.name && f.name.startsWith('tev2_full_'))
      .map((f: any) => ({
        filename: f.name,
        size: f.size || 'unknown',
        date: f.date || 'unknown',
      }));

    res.json({ backups });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Failed to list cloud backups', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    res.status(500).json({ error: t('errors.backup.listBackupsFailed') });
  }
});

backupRouter.post('/cloud/restore', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const { filename, dbOnly = false } = req.body;
  if (!filename) {
    return res.status(400).json({ error: t('errors.backup.filenameRequired') });
  }
  const SAFE_FILENAME = /^tev2_full_\d{8}_\d{6}\.tar\.gz$/;
  if (!SAFE_FILENAME.test(filename)) {
    return res.status(400).json({ error: 'Invalid backup filename format' });
  }
  try {
    const job = createJob('restore');

    const remotePath = `/TEV2/backups/${filename}`;
    const localPath = `/backups/${filename}`;

    updateJobStatus(job.id, 'running', 'Downloading from MEGA...');

    sidecarFetch('/download', {
      method: 'POST',
      body: JSON.stringify({ remotePath, localPath }),
    }).then(async (downloadRes) => {
      if (!downloadRes.ok) {
        throw new Error('Download request failed');
      }
      const downloadData = await downloadRes.json();

      const pollDownload = async (retries = 0): Promise<void> => {
        if (retries >= 60) {
          updateJobStatus(job.id, 'failed', undefined, 'Download timed out');
          return;
        }
        try {
          const statusRes = await sidecarFetch(`/jobs/${downloadData.jobId}`);
          if (statusRes.ok) {
            const dlJob = await statusRes.json();
            if (dlJob.status === 'success') {
              updateJobStatus(job.id, 'running', 'Download complete. Running restore...');

              const args = ['--file', filename, '--force'];
              if (dbOnly) {
                args.push('--db-only');
              }

              const result = await runScript(RESTORE_SCRIPT, args, job.id);
              if (!result.success) {
                updateJobStatus(job.id, 'failed', undefined, result.error);
              }
              return;
            } else if (dlJob.status === 'failed') {
              updateJobStatus(job.id, 'failed', undefined, dlJob.error || 'Download failed');
              return;
            }
          }
        } catch { /* retry */ }
        setTimeout(() => pollDownload(retries + 1), 3000);
      };

      await pollDownload();
    }).catch((error) => {
      const errMsg = error instanceof Error ? error.message : 'Download failed';
      updateJobStatus(job.id, 'failed', undefined, errMsg);
    });

    res.json({ jobId: job.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Cloud restore failed to start', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    res.status(500).json({ error: t('errors.backup.restoreStartFailed') });
  }
});

backupRouter.post('/restore/upload', authenticateToken, requirePermission('settings:manage'), backupUpload.single('backup'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);

  if (!req.file) {
    return res.status(400).json({ error: t('errors.backup.noFileUploaded') });
  }

  const filename = req.file.originalname?.toLowerCase() || '';
  const isSql = filename.endsWith('.sql');
  const isSqlGz = filename.endsWith('.sql.gz');
  const isTarGz = filename.endsWith('.tar.gz');

  if (!isSql && !isSqlGz && !isTarGz) {
    return res.status(400).json({ error: t('errors.backup.invalidFileType') });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: t('errors.settings.databaseConfigNotFound') });
  }

  const dbConfig = parseDatabaseUrl(databaseUrl);
  if (!dbConfig) {
    return res.status(500).json({ error: t('errors.settings.invalidDatabaseConfig') });
  }

  const job = createJob('restore');
  const env = { ...process.env, PGPASSWORD: dbConfig.password };

  (async () => {
    try {
      if (!req.file) {
        updateJobStatus(job.id, 'failed', undefined, 'No file provided');
        return;
      }
      if (isSql) {
        await restoreFromSql(req.file.buffer, job.id, dbConfig, env);
      } else if (isSqlGz) {
        await restoreFromSqlGz(req.file.buffer, job.id, dbConfig, env);
      } else if (isTarGz) {
        await restoreFromTarGz(req.file.buffer, job.id, dbConfig, env);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateJobStatus(job.id, 'failed', undefined, errMsg);
    }
  })();

  res.json({ jobId: job.id });
});

const applyMigrations = async (jobId: string): Promise<void> => {
  updateJobStatus(jobId, 'running', 'Applying database migrations...');

  const maxIterations = 60;
  let iteration = 0;
  let skipped = 0;

  while (iteration < maxIterations) {
    iteration++;

    const result = await new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve) => {
      const child = spawn('npx', ['prisma', 'migrate', 'deploy'], {
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });
      child.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
      child.on('error', (err) => resolve({ exitCode: 1, stdout, stderr: err.message }));
    });

    const output = result.stdout + result.stderr;
    updateJobStatus(jobId, 'running', `Migration iteration ${iteration}: ${output.slice(-200)}`);

    if (output.includes('No pending migrations to apply')) {
      updateJobStatus(jobId, 'running', `All migrations applied (${skipped} resolved as already in schema)`);
      return;
    }

    if (/migrations?.*applied/.test(output) && !output.includes('Error')) {
      updateJobStatus(jobId, 'running', `All migrations applied (${skipped} resolved as already in schema)`);
      return;
    }

    const alreadyExistsMatch = output.match(/already exists|42701|42P07|42710|42P04|42723/);
    if (alreadyExistsMatch) {
      let failedName = output.match(/Migration name:\s+(\S+)/)?.[1];
      if (!failedName) {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
          const cfg = parseDatabaseUrl(dbUrl);
          if (cfg) {
            try {
              const { stdout: nameOut } = await execAsync(
                `psql -h ${cfg.host} -p ${cfg.port} -U ${cfg.user} -d ${cfg.database} -t -A -c "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;"`,
                { env: { ...process.env, PGPASSWORD: cfg.password } }
              );
              failedName = nameOut.trim();
            } catch { /* ignore */ }
          }
        }
      }
      if (failedName) {
        updateJobStatus(jobId, 'running', `Migration '${failedName}' -- already in schema, marking as applied`);
        await new Promise<{ exitCode: number }>((resolve) => {
          const resolveChild = spawn('npx', ['prisma', 'migrate', 'resolve', '--applied', failedName!], {
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          resolveChild.on('close', (code) => resolve({ exitCode: code ?? 1 }));
          resolveChild.on('error', () => resolve({ exitCode: 1 }));
        });
        skipped++;
        continue;
      }
    }

    if (output.includes('P3018')) {
      let blockedName: string | undefined;
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        const cfg = parseDatabaseUrl(dbUrl);
        if (cfg) {
          try {
            const { stdout: nameOut } = await execAsync(
              `psql -h ${cfg.host} -p ${cfg.port} -U ${cfg.user} -d ${cfg.database} -t -A -c "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;"`,
              { env: { ...process.env, PGPASSWORD: cfg.password } }
            );
            blockedName = nameOut.trim();
          } catch { /* ignore */ }
        }
      }
      if (blockedName) {
        updateJobStatus(jobId, 'running', `Resolving blocked migration '${blockedName}'...`);
        await new Promise<{ exitCode: number }>((resolve) => {
          const resolveChild = spawn('npx', ['prisma', 'migrate', 'resolve', '--applied', blockedName!], {
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          resolveChild.on('close', (code) => resolve({ exitCode: code ?? 1 }));
          resolveChild.on('error', () => resolve({ exitCode: 1 }));
        });
        skipped++;
        continue;
      }
    }

    if (output.includes('Error')) {
      throw new Error(`Migration failed: ${output.slice(-500)}`);
    }

    return;
  }

  throw new Error('Migration apply: too many retry iterations');
};

const restoreFromSql = async (buffer: Buffer, jobId: string, dbConfig: ReturnType<typeof parseDatabaseUrl>, env: NodeJS.ProcessEnv): Promise<void> => {
  const sqlPath = path.join(os.tmpdir(), `restore_${jobId}.sql`);

  try {
    updateJobStatus(jobId, 'running', 'Writing SQL file to disk...');
    await fs.writeFile(sqlPath, buffer);

    updateJobStatus(jobId, 'running', 'Restoring database from SQL file...');

    const psqlArgs = [
      '-h', dbConfig!.host,
      '-p', dbConfig!.port,
      '-U', dbConfig!.user,
      '-d', dbConfig!.database,
      '-f', sqlPath,
    ];

    const result = await new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve, reject) => {
      const psql = spawn('psql', psqlArgs, { env });

      let stdout = '';
      let stderr = '';

      psql.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        updateJobStatus(jobId, 'running', text);
      });

      psql.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        updateJobStatus(jobId, 'running', text);
      });

      psql.on('close', (code) => {
        resolve({ exitCode: code ?? 1, stdout, stderr });
      });

      psql.on('error', reject);
    });

    if (result.exitCode !== 0) {
      throw new Error(`psql failed with exit code ${result.exitCode}: ${result.stderr}`);
    }

    await applyMigrations(jobId);

    updateJobStatus(jobId, 'success', 'Database restored successfully');
  } finally {
    try { await fs.unlink(sqlPath); } catch { /* ignore */ }
  }
};

const restoreFromSqlGz = async (buffer: Buffer, jobId: string, dbConfig: ReturnType<typeof parseDatabaseUrl>, env: NodeJS.ProcessEnv): Promise<void> => {
  const gzPath = path.join(os.tmpdir(), `restore_${jobId}.sql.gz`);

  try {
    updateJobStatus(jobId, 'running', 'Writing compressed SQL file to disk...');
    await fs.writeFile(gzPath, buffer);

    updateJobStatus(jobId, 'running', 'Restoring database from compressed SQL file...');

    const gunzip = spawn('gunzip', ['-c', gzPath], { env });
    const psqlArgs = [
      '-h', dbConfig!.host,
      '-p', dbConfig!.port,
      '-U', dbConfig!.user,
      '-d', dbConfig!.database,
    ];
    const psql = spawn('psql', psqlArgs, { env });

    (gunzip.stdout as any).pipe(psql.stdin);

    let stdout = '';
    let stderr = '';

    psql.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      updateJobStatus(jobId, 'running', text);
    });

    psql.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      updateJobStatus(jobId, 'running', text);
    });

    await new Promise<void>((resolve, reject) => {
      psql.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql failed with exit code ${code}: ${stderr}`));
        }
      });

      gunzip.on('error', reject);
      psql.on('error', reject);
    });

    await applyMigrations(jobId);

    updateJobStatus(jobId, 'success', 'Database restored successfully');
  } finally {
    try { await fs.unlink(gzPath); } catch { /* ignore */ }
  }
};

const restoreFromTarGz = async (buffer: Buffer, jobId: string, dbConfig: ReturnType<typeof parseDatabaseUrl>, env: NodeJS.ProcessEnv): Promise<void> => {
  const tarPath = path.join(os.tmpdir(), `restore_${jobId}.tar.gz`);
  const extractDir = path.join(os.tmpdir(), `restore_${jobId}`);

  try {
    updateJobStatus(jobId, 'running', 'Writing tar.gz archive to disk...');
    await fs.writeFile(tarPath, buffer);

    updateJobStatus(jobId, 'running', 'Extracting archive...');
    await fs.mkdir(extractDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      const tar = spawn('tar', ['xzf', tarPath, '-C', extractDir], { env });
      let stderr = '';

      tar.stderr.on('data', (data) => {
        stderr += data.toString();
        updateJobStatus(jobId, 'running', data.toString());
      });

      tar.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`tar extraction failed with exit code ${code}: ${stderr}`));
      });

      tar.on('error', reject);
    });

    const findSqlFile = async (dir: string): Promise<{ sqlGz: string | null; sql: string | null }> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const result = await findSqlFile(fullPath);
          if (result.sql || result.sqlGz) return result;
        } else if (entry.name.endsWith('.sql.gz')) {
          return { sqlGz: fullPath, sql: null };
        } else if (entry.name.endsWith('.sql')) {
          return { sql: fullPath, sqlGz: null };
        }
      }
      return { sql: null, sqlGz: null };
    };

    const { sql: sqlFile, sqlGz: sqlGzFile } = await findSqlFile(extractDir);

    let sqlFilePath: string | null = null;

    if (sqlGzFile) {
      updateJobStatus(jobId, 'running', 'Decompressing SQL file...');
      sqlFilePath = path.join(extractDir, 'database.sql');
      await new Promise<void>((resolve, reject) => {
        const gunzip = spawn('gunzip', ['-c', sqlGzFile], { env });
        const writeStream = require('fs').createWriteStream(sqlFilePath!);

        (gunzip.stdout as any).pipe(writeStream);

        writeStream.on('close', resolve);
        writeStream.on('error', reject);
        gunzip.on('error', reject);
      });
    } else if (sqlFile) {
      sqlFilePath = sqlFile;
    } else {
      throw new Error('No SQL file found in archive');
    }

    updateJobStatus(jobId, 'running', 'Cleaning SQL file...');
    let sqlContent = await fs.readFile(sqlFilePath, 'utf-8');
    sqlContent = sqlContent.replace(/\\(restrict|unrestrict)\b/g, '');
    await fs.writeFile(sqlFilePath, sqlContent);

    updateJobStatus(jobId, 'running', 'Dropping existing database connections...');
    await new Promise<void>((resolve, reject) => {
      const psql = spawn('psql', ['-h', dbConfig!.host, '-p', dbConfig!.port, '-U', dbConfig!.user, '-d', 'postgres', '-c', `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbConfig!.database}' AND pid <> pg_backend_pid();`], { env });
      psql.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to drop connections')));
      psql.on('error', reject);
    });

    updateJobStatus(jobId, 'running', 'Dropping existing database...');
    await new Promise<void>((resolve, reject) => {
      const psql = spawn('psql', ['-h', dbConfig!.host, '-p', dbConfig!.port, '-U', dbConfig!.user, '-d', 'postgres', '-c', `DROP DATABASE IF EXISTS ${dbConfig!.database};`], { env });
      psql.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to drop database')));
      psql.on('error', reject);
    });

    updateJobStatus(jobId, 'running', 'Creating database...');
    await new Promise<void>((resolve, reject) => {
      const psql = spawn('psql', ['-h', dbConfig!.host, '-p', dbConfig!.port, '-U', dbConfig!.user, '-d', 'postgres', '-c', `CREATE DATABASE ${dbConfig!.database} TEMPLATE template0;`], { env });
      psql.on('close', (code) => code === 0 ? resolve() : reject(new Error('Failed to create database')));
      psql.on('error', reject);
    });

    updateJobStatus(jobId, 'running', 'Restoring database...');
    const psqlResult = await new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve, reject) => {
      const psql = spawn('psql', ['-h', dbConfig!.host, '-p', dbConfig!.port, '-U', dbConfig!.user, '-d', dbConfig!.database, '-f', sqlFilePath!], { env });

      let stdout = '';
      let stderr = '';

      psql.stdout.on('data', (data) => {
        stdout += data.toString();
        updateJobStatus(jobId, 'running', data.toString());
      });

      psql.stderr.on('data', (data) => {
        stderr += data.toString();
        updateJobStatus(jobId, 'running', data.toString());
      });

      psql.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
      psql.on('error', reject);
    });

    if (psqlResult.exitCode !== 0) {
      throw new Error(`psql failed with exit code ${psqlResult.exitCode}: ${psqlResult.stderr}`);
    }

    const volumesDir = path.join(extractDir, 'volumes');

    try {
      const storageTar = path.join(volumesDir, 'storage_data.tar.gz');
      await fs.access(storageTar);
      updateJobStatus(jobId, 'running', 'Restoring storage volume...');
      await fs.rm('/app/storage/*', { recursive: true, force: true });
      await new Promise<void>((resolve, reject) => {
        const tar = spawn('tar', ['xzf', storageTar, '-C', '/app/storage'], { env });
        let stderr = '';

        tar.stderr.on('data', (data) => {
          stderr += data.toString();
          updateJobStatus(jobId, 'running', data.toString());
        });

        tar.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Failed to restore storage: ${stderr}`)));
        tar.on('error', reject);
      });
    } catch {
      updateJobStatus(jobId, 'running', 'No storage volume in archive, skipping...');
    }

    try {
      const uploadsTar = path.join(volumesDir, 'uploads_data.tar.gz');
      await fs.access(uploadsTar);
      updateJobStatus(jobId, 'running', 'Restoring uploads volume...');
      await fs.rm('/app/uploads/*', { recursive: true, force: true });
      await new Promise<void>((resolve, reject) => {
        const tar = spawn('tar', ['xzf', uploadsTar, '-C', '/app/uploads'], { env });
        let stderr = '';

        tar.stderr.on('data', (data) => {
          stderr += data.toString();
          updateJobStatus(jobId, 'running', data.toString());
        });

        tar.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Failed to restore uploads: ${stderr}`)));
        tar.on('error', reject);
      });
    } catch {
      updateJobStatus(jobId, 'running', 'No uploads volume in archive, skipping...');
    }

    updateJobStatus(jobId, 'running', 'Running ANALYZE...');
    await new Promise<void>((resolve, reject) => {
      const psql = spawn('psql', ['-h', dbConfig!.host, '-p', dbConfig!.port, '-U', dbConfig!.user, '-d', dbConfig!.database, '-c', 'ANALYZE;'], { env });
      psql.on('close', (code) => code === 0 ? resolve() : reject(new Error('ANALYZE failed')));
      psql.on('error', reject);
    });

    await applyMigrations(jobId);

    updateJobStatus(jobId, 'success', 'Restore completed successfully');
  } finally {
    try { await fs.unlink(tarPath); } catch { /* ignore */ }
    try { await fs.rm(extractDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
};

backupRouter.get('/schedule', authenticateToken, requirePermission('settings:manage'), async (_req: Request, res: Response) => {
  try {
    const data = await getScheduleData();
    res.json(data);
  } catch {
    res.json({ enabled: false, hour: 4, compress: false });
  }
});

backupRouter.put('/schedule', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const { enabled, hour = 4, compress = false } = req.body;

  try {
    await updateSchedule(enabled, hour, compress);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('must be')) {
      return res.status(400).json({ error: message });
    }
    logError('Failed to update backup schedule', {
      correlationId: (req as any).correlationId,
      error: message,
    });
    res.status(500).json({ error: t('errors.backup.scheduleUpdateFailed') });
  }
});

backupRouter.get('/settings', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const [cloudResponse, scheduleStatus, retention] = await Promise.all([
      sidecarFetch('/status').catch(() => null),
      getScheduleData(),
      getRetention(),
    ]);

    let cloudStatus = { installed: false, loggedIn: false, email: null };
    if (cloudResponse && cloudResponse.ok) {
      cloudStatus = await cloudResponse.json();
    }

    res.json({
      cloud: {
        provider: 'mega',
        enabled: cloudStatus.installed && cloudStatus.loggedIn,
        megaEmail: cloudStatus.email,
        megaLoggedIn: cloudStatus.loggedIn,
        retention,
      },
      schedule: {
        enabled: scheduleStatus.enabled,
        hour: scheduleStatus.hour,
        compress: scheduleStatus.compress,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Failed to get backup settings', {
      correlationId: (req as any).correlationId,
      error: errorMessage,
    });
    res.status(500).json({ error: t('errors.backup.getSettingsFailed') });
  }
});

backupRouter.put('/settings', authenticateToken, requirePermission('settings:manage'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const { schedule, retention } = req.body;

  if (!schedule && retention === undefined) {
    return res.status(400).json({ error: t('errors.backup.scheduleRequired') });
  }

  try {
    if (schedule) {
      const { enabled, hour = 4, compress = false } = schedule;
      await updateSchedule(enabled, hour, compress);
    }

    if (retention !== undefined) {
      const retentionNum = parseInt(String(retention), 10);
      if (isNaN(retentionNum) || retentionNum < 1 || retentionNum > 365) {
        return res.status(400).json({ error: 'Retention must be between 1 and 365 days' });
      }
      const existing = await prisma.settings.findFirst();
      if (existing) {
        await prisma.settings.update({
          where: { id: existing.id },
          data: { cloudBackupRetention: retentionNum },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('must be')) {
      return res.status(400).json({ error: message });
    }
    logError('Failed to save backup settings', {
      correlationId: (req as any).correlationId,
      error: message,
    });
    res.status(500).json({ error: t('errors.backup.saveSettingsFailed') });
  }
});
