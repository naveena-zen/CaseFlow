const mongoose = require('mongoose');

const DeadlineSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  title: { type: String, required: true },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Deadline', DeadlineSchema);
