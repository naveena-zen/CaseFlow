const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const Deadline = require('../models/Deadline');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/cases
router.get('/', verifyToken, async (req, res) => {
  try {
    let cases;
    if (req.user.role === 'lawyer') {
      cases = await Case.find({ lawyerId: req.user.id }).populate('clientId', 'name email');
    } else {
      cases = await Case.find({ clientId: req.user.id }).populate('lawyerId', 'name email');
    }
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cases/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const c = await Case.findById(req.params.id)
      .populate('lawyerId', 'name email')
      .populate('clientId', 'name email');
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cases — lawyer only
router.post('/', verifyToken, requireRole('lawyer'), async (req, res) => {
  try {
    const { title, description, clientId } = req.body;
    const newCase = new Case({ title, description, clientId, lawyerId: req.user.id });
    await newCase.save();
    const populated = await Case.findById(newCase._id).populate('clientId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/cases/:id/status — lawyer only
router.patch('/:id/status', verifyToken, requireRole('lawyer'), async (req, res) => {
  try {
    const { status } = req.body;
    const c = await Case.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole('lawyer'), async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.id)
    if (!case_) return res.status(404).json({ message: 'Case not found' })
    if (case_.status !== 'Closed') return res.status(400).json({ message: 'Only closed cases can be deleted' })
    await Case.findByIdAndDelete(req.params.id)
    await Document.deleteMany({ caseId: req.params.id })
    await Deadline.deleteMany({ caseId: req.params.id })
    res.json({ message: 'Case deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router;
