const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ caseId, userId, action, description, details = {} }) => {
  try {
    const log = new ActivityLog({
      caseId,
      userId,
      action,
      description,
      details
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to record activity log:', err.message);
  }
};

module.exports = { logActivity };
