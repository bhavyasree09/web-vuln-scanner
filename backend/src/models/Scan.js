const mongoose = require('mongoose');

const vulnerabilitySchema = new mongoose.Schema({
  type: String,
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'] },
  title: String,
  description: String,
  url: String,
  evidence: String,
  recommendation: String,
  owaspCategory: String,
  owaspId: String
});

const scanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed'],
    default: 'queued'
  },
  progress: { type: Number, default: 0 },
  currentCheck: { type: String, default: '' },
  urlsCrawled: { type: Number, default: 0 },
  vulnerabilities: [vulnerabilitySchema],
  summary: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    info: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  owaspMapping: { type: Map, of: [String] },
  errorMessage: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Scan', scanSchema);
