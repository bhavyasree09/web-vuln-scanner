const { spawn } = require('child_process');
const path = require('path');
const Scan = require('../models/Scan');

const SCANNER_PATH = path.join(__dirname, '../../scanner/main.py');

const runScanner = async (scanId, url) => {
  const pythonPath = process.env.PYTHON_PATH || 'python';

  // Update scan to running
  await Scan.findByIdAndUpdate(scanId, {
    status: 'running',
    startedAt: new Date(),
    progress: 0,
    currentCheck: 'Starting crawler...'
  });

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [SCANNER_PATH, '--url', url, '--scan-id', scanId.toString()], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let buffer = '';

    proc.stdout.on('data', async (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          await handleScannerMessage(scanId, msg);
        } catch (e) {
          console.error('Failed to parse scanner output:', line);
        }
      }
    });

    proc.stderr.on('data', (data) => {
      console.error(`[Scanner STDERR] ${data}`);
    });

    proc.on('close', async (code) => {
      try {
        const scan = await Scan.findById(scanId);
        if (scan && scan.status === 'running') {
          if (code === 0) {
            await Scan.findByIdAndUpdate(scanId, {
              status: 'completed',
              progress: 100,
              completedAt: new Date()
            });
          } else {
            await Scan.findByIdAndUpdate(scanId, {
              status: 'failed',
              errorMessage: `Scanner exited with code ${code}`,
              completedAt: new Date()
            });
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    proc.on('error', async (err) => {
      console.error('Failed to start scanner process:', err);
      await Scan.findByIdAndUpdate(scanId, {
        status: 'failed',
        errorMessage: `Failed to start scanner: ${err.message}`,
        completedAt: new Date()
      });
      reject(err);
    });
  });
};

const handleScannerMessage = async (scanId, msg) => {
  const update = {};

  if (msg.type === 'progress') {
    update.progress = msg.progress;
    update.currentCheck = msg.message;
    if (msg.urls_crawled !== undefined) update.urlsCrawled = msg.urls_crawled;
  } else if (msg.type === 'vulnerability') {
    const vuln = {
      type: msg.vuln_type,
      severity: msg.severity,
      title: msg.title,
      description: msg.description,
      url: msg.url,
      evidence: msg.evidence || '',
      recommendation: msg.recommendation,
      owaspCategory: msg.owasp_category,
      owaspId: msg.owasp_id
    };
    await Scan.findByIdAndUpdate(scanId, {
      $push: { vulnerabilities: vuln }
    });
    return;
  } else if (msg.type === 'summary') {
    update.summary = msg.summary;
    update.owaspMapping = msg.owasp_mapping;
  }

  if (Object.keys(update).length > 0) {
    await Scan.findByIdAndUpdate(scanId, update);
  }
};

module.exports = { runScanner };
