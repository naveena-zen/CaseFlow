const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
