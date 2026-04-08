const express = require('express');
const PDFDocument = require('pdfkit');
const Scan = require('../models/Scan');
const authMiddleware = require('../middleware/auth');
const { scanRateLimiter } = require('../middleware/rateLimiter');
const { runScanner } = require('../services/scannerService');

const router = express.Router();

const { exec } = require("child_process");

router.post('/api/scans', (req, res) => {
  const { url } = req.body;

  exec(`python3 /scanner/main.py ${url}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Scan failed" });
    }

    try {
      const result = stdout; // or JSON.parse(stdout) if JSON
      res.json({
        status: "completed",
        output: result
      });
    } catch (err) {
      res.json({ output: stdout });
    }
  });
});

// POST /api/scans — start a new scan
router.post('/', authMiddleware, scanRateLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Validate URL format
    try { new URL(url); } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const scan = await Scan.create({ userId: req.userId, url, status: 'queued' });

    // Respond immediately, run scanner async
    res.status(201).json({ scanId: scan._id, status: 'queued' });

    // Fire and forget
    runScanner(scan._id, url).catch(err => {
      console.error(`Scanner failed for scan ${scan._id}:`, err);
    });
  } catch (err) {
    console.error('Create scan error:', err);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

// GET /api/scans — list user's scans
router.get('/', authMiddleware, async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.userId })
      .select('-vulnerabilities')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ scans });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// GET /api/scans/:id — get full scan with vulnerabilities
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

// DELETE /api/scans/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ message: 'Scan deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

// GET /api/scans/:id/report/json
router.get('/:id/report/json', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const report = {
      scanId: scan._id,
      targetUrl: scan.url,
      status: scan.status,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      urlsCrawled: scan.urlsCrawled,
      summary: scan.summary,
      owaspMapping: scan.owaspMapping,
      vulnerabilities: scan.vulnerabilities,
      generatedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="scan-report-${scan._id}.json"`);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate JSON report' });
  }
});

// GET /api/scans/:id/report/pdf
router.get('/:id/report/pdf', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="scan-report-${scan._id}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).fillColor('#1a56db').text('Web Vulnerability Scan Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6b7280')
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown();

    // Scan info
    doc.fontSize(14).fillColor('#111827').text('Scan Information');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#374151');
    doc.text(`Target URL: ${scan.url}`);
    doc.text(`Scan ID: ${scan._id}`);
    doc.text(`Status: ${scan.status.toUpperCase()}`);
    doc.text(`Started: ${scan.startedAt ? scan.startedAt.toLocaleString() : 'N/A'}`);
    doc.text(`Completed: ${scan.completedAt ? scan.completedAt.toLocaleString() : 'N/A'}`);
    doc.text(`URLs Crawled: ${scan.urlsCrawled}`);
    doc.moveDown();

    // Summary
    doc.fontSize(14).fillColor('#111827').text('Vulnerability Summary');
    doc.moveDown(0.3);
    const s = scan.summary;
    const severityColors = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#2563eb', info: '#6b7280' };
    ['critical', 'high', 'medium', 'low', 'info'].forEach(sev => {
      const count = s[sev] || 0;
      if (count > 0) {
        doc.fontSize(10).fillColor(severityColors[sev])
          .text(`  ${sev.toUpperCase()}: ${count}`);
      }
    });
    doc.fontSize(10).fillColor('#111827').text(`  TOTAL: ${s.total || 0}`);
    doc.moveDown();

    // Vulnerabilities
    if (scan.vulnerabilities && scan.vulnerabilities.length > 0) {
      doc.fontSize(14).fillColor('#111827').text('Vulnerability Details');
      doc.moveDown(0.5);

      for (const vuln of scan.vulnerabilities) {
        const sevColor = severityColors[vuln.severity] || '#374151';
        doc.fontSize(12).fillColor(sevColor).text(`[${(vuln.severity || '').toUpperCase()}] ${vuln.title || vuln.type}`);
        doc.fontSize(9).fillColor('#374151');
        doc.text(`URL: ${vuln.url || 'N/A'}`);
        doc.text(`OWASP: ${vuln.owaspId || 'N/A'} – ${vuln.owaspCategory || 'N/A'}`);
        doc.moveDown(0.2);
        doc.text(`Description: ${vuln.description || ''}`);
        doc.moveDown(0.2);
        if (vuln.evidence) doc.text(`Evidence: ${vuln.evidence}`);
        doc.moveDown(0.2);
        doc.fillColor('#15803d').text(`Recommendation: ${vuln.recommendation || 'N/A'}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#f3f4f6').stroke();
        doc.moveDown(0.5);
      }
    } else {
      doc.fontSize(10).fillColor('#16a34a').text('No vulnerabilities detected.');
    }

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

module.exports = router;
