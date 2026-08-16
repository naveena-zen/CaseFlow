const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'CASE_CREATED',
        'STATUS_CHANGE',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_VERSION_UPLOAD',
        'DOCUMENT_DELETED',
        'DEADLINE_CREATED',
        'DEADLINE_UPDATED',
        'DEADLINE_DELETED'
      ]
    },
    description: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
