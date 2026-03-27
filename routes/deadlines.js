const express = require('express');
const router = express.Router();
const Deadline = require('../models/Deadline');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/deadlines/:caseId — lawyer adds deadline
router.post('/:caseId', verifyToken, requireRole('lawyer'), async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    const deadline = new Deadline({ caseId: req.params.caseId, title, dueDate });
    await deadline.save();
    res.status(201).json(deadline);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deadlines/:caseId — list deadlines
router.get('/:caseId', verifyToken, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ caseId: req.params.caseId }).sort({ dueDate: 1 });
    res.json(deadlines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/deadlines/:id — update deadline
router.put('/:id', verifyToken, requireRole('lawyer'), async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    const updated = await Deadline.findByIdAndUpdate(
      req.params.id,
      { title, dueDate },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Deadline not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/deadlines/:id — delete deadline
router.delete('/:id', verifyToken, requireRole('lawyer'), async (req, res) => {
  try {
    const deleted = await Deadline.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Deadline not found' });
    res.json({ message: 'Deadline deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
