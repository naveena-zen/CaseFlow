const express = require('express');
const router = express.Router();
const Deadline = require('../models/Deadline');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { verifyCaseAccess, verifyCaseLawyer, verifyDeadlineAccess } = require('../middleware/ownership');
const { deadlineSchema } = require('../validators');
const { logActivity } = require('../utils/activityLogger');

// POST /api/deadlines/:caseId — lawyer adds deadline
router.post('/:caseId', verifyToken, requireRole('lawyer'), verifyCaseLawyer, validate(deadlineSchema), async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    const deadline = new Deadline({
      caseId: req.params.caseId,
      title,
      dueDate: new Date(dueDate)
    });
    await deadline.save();

    await logActivity({
      caseId: req.params.caseId,
      userId: req.user.id,
      action: 'DEADLINE_CREATED',
      description: `Created deadline "${title}" (Due: ${new Date(dueDate).toLocaleDateString()})`
    });

    res.status(201).json(deadline);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/deadlines/:caseId — list deadlines for a case
router.get('/:caseId', verifyToken, verifyCaseAccess, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ caseId: req.params.caseId }).sort({ dueDate: 1 });
    res.json(deadlines);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// PUT /api/deadlines/:id — lawyer updates deadline
router.put('/:id', verifyToken, requireRole('lawyer'), verifyDeadlineAccess, validate(deadlineSchema), async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    const updated = await Deadline.findByIdAndUpdate(
      req.params.id,
      { title, dueDate: new Date(dueDate) },
      { new: true }
    );

    await logActivity({
      caseId: updated.caseId,
      userId: req.user.id,
      action: 'DEADLINE_UPDATED',
      description: `Updated deadline "${title}" (Due: ${new Date(dueDate).toLocaleDateString()})`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// DELETE /api/deadlines/:id — lawyer deletes deadline
router.delete('/:id', verifyToken, requireRole('lawyer'), verifyDeadlineAccess, async (req, res) => {
  try {
    const deadline = req.deadline;
    await Deadline.findByIdAndDelete(req.params.id);

    await logActivity({
      caseId: deadline.caseId,
      userId: req.user.id,
      action: 'DEADLINE_DELETED',
      description: `Deleted deadline "${deadline.title}"`
    });

    res.json({ message: 'Deadline deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
