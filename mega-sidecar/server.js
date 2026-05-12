const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const execAsync = promisify(exec);

const app = express();
app.use(express.json());

const jobs = new Map();
const JOB_TTL_MS = 60 * 60 * 1000;
const SPAWN_TIMEOUT_MS = 120 * 1000;
const WHOAMI_TIMEOUT_MS = 10 * 1000;

function generateJobId() {
  return crypto.randomUUID();
}

function createJob(type) {
  const job = {
    id: generateJobId(),
    type,
    status: 'running',
    output: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };
  jobs.set(job.id, job);
  return job;
}

function spawnCommand(command, args, job) {
  const proc = spawn(command, args);

  const timeout = setTimeout(() => {
    proc.kill('SIGKILL');
    job.completedAt = new Date().toISOString();
    job.status = 'failed';
    job.error = 'Process timed out';
  }, SPAWN_TIMEOUT_MS);

  proc.stdout.on('data', (data) => {
    job.output.push({ type: 'stdout', text: data.toString().trim() });
  });

  proc.stderr.on('data', (data) => {
    job.output.push({ type: 'stderr', text: data.toString().trim() });
  });

  proc.on('close', (code) => {
    clearTimeout(timeout);
    if (job.completedAt) return;
    job.completedAt = new Date().toISOString();
    if (code === 0) {
      job.status = 'success';
    } else {
      job.status = 'failed';
      job.error = `Process exited with code ${code}`;
    }
  });

  proc.on('error', (err) => {
    clearTimeout(timeout);
    if (job.completedAt) return;
    job.completedAt = new Date().toISOString();
    job.status = 'failed';
    job.error = err.message;
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - new Date(job.startedAt).getTime() > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

function apiKeyMiddleware(req, res, next) {
  const configuredKey = process.env.SIDECAR_API_KEY;
  if (!configuredKey) {
    return next();
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  if (token !== configuredKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
}

app.use(apiKeyMiddleware);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/status', async (_req, res) => {
  try {
    const { stdout, stderr } = await execAsync('mega-whoami', { timeout: WHOAMI_TIMEOUT_MS });
    const output = (stdout || '').trim();
    const errOutput = (stderr || '').trim();
    if (errOutput.includes('Not logged in') || errOutput.includes('not found')) {
      return res.json({ installed: true, loggedIn: false, email: null });
    }
    if (errOutput.includes('login in')) {
      return res.json({ installed: true, loggedIn: false, email: null, stuck: true });
    }
    if (output && output.includes('@')) {
      return res.json({ installed: true, loggedIn: true, email: output });
    }
    return res.json({ installed: true, loggedIn: false, email: null });
  } catch (err) {
    if (err.killed) {
      return res.json({ installed: true, loggedIn: false, email: null, stuck: true });
    }
    if (err.code === 'ENOENT' || (err.message && err.message.includes('not found'))) {
      return res.json({ installed: false, loggedIn: false, email: null });
    }
    return res.json({ installed: true, loggedIn: false, email: null });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const job = createJob('login');
  spawnCommand('mega-login', [email, password], job);
  res.json({ jobId: job.id });
});

app.post('/logout', async (req, res) => {
  try {
    await execAsync('mega-logout', { timeout: 5000 });
  } catch (_err) {}
  res.json({ success: true });
});

app.post('/recover', async (_req, res) => {
  try {
    await execAsync('pkill -f mega-cmd-server', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 2000));
  } catch (_err) {}
  res.json({ success: true });
});

app.post('/upload', (req, res) => {
  const { localPath, remotePath } = req.body;
  if (!localPath || !remotePath) {
    return res.status(400).json({ error: 'localPath and remotePath are required' });
  }
  if (!fs.existsSync(localPath)) {
    return res.status(400).json({ error: 'localPath does not exist' });
  }
  const job = createJob('upload');
  spawnCommand('mega-put', [localPath, remotePath], job);
  res.json({ jobId: job.id });
});

app.post('/download', (req, res) => {
  const { remotePath, localPath } = req.body;
  if (!remotePath || !localPath) {
    return res.status(400).json({ error: 'remotePath and localPath are required' });
  }
  const job = createJob('download');
  spawnCommand('mega-get', [remotePath, localPath], job);
  res.json({ jobId: job.id });
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

app.get('/list', async (req, res) => {
  const listPath = req.query.path || '/';
  try {
    const { stdout } = await execAsync(`mega-ls -l ${shellEscape(listPath)} --time-format="%Y-%m-%d %H:%M:%S"`, { timeout: 15000 });
    const lines = stdout.trim().split('\n').filter(Boolean);
    const files = [];
    for (const line of lines) {
      if (line.startsWith('FLAGS ')) continue;
      const match = line.match(/^\S+\s+\d+\s+(\d+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$/);
      if (match) {
        files.push({ name: match[3], date: match[2], size: formatBytes(parseInt(match[1], 10)) });
      }
    }
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/mkdir', async (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: 'path is required' });
  }
  try {
    await execAsync(`mega-mkdir ${shellEscape(path)}`);
  } catch (_err) {}
  res.json({ success: true });
});

app.post('/rm', async (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: 'path is required' });
  }
  try {
    await execAsync(`mega-rm ${shellEscape(path)}`);
  } catch (_err) {}
  res.json({ success: true });
});

app.get('/find', async (req, res) => {
  const path = req.query.path || '/';
  const pattern = req.query.pattern || '*';
  try {
    const { stdout } = await execAsync(`mega-find ${shellEscape(path)} --pattern="${pattern.replace(/"/g, '\\"')}" --time-format="%s"`);
    const files = stdout.trim().split('\n').filter(Boolean);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

function shellEscape(str) {
  return `'${str.replace(/'/g, "'\\''")}'`;
}

app.listen(3002, () => {
  console.log('MEGA sidecar listening on port 3002');
});
