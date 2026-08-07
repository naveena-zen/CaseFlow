const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const Deadline = require('../models/Deadline');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { verifyCaseAccess, verifyCaseLawyer } = require('../middleware/ownership');
const { createCaseSchema, updateCaseStatusSchema } = require('../validators');

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
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/cases/:id — with ownership check
router.get('/:id', verifyToken, verifyCaseAccess, async (req, res) => {
  try {
    const populated = await Case.findById(req.case._id)
      .populate('lawyerId', 'name email')
      .populate('clientId', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/cases — lawyer only + Zod validation
router.post('/', verifyToken, requireRole('lawyer'), validate(createCaseSchema), async (req, res) => {
  try {
    const { title, description, clientId } = req.body;
    
    // Verify client exists and is a client
    const clientUser = await User.findById(clientId);
    if (!clientUser || clientUser.role !== 'client') {
      return res.status(400).json({
        error: { code: 'INVALID_CLIENT', message: 'Target client does not exist or is not a client user' }
      });
    }

    const newCase = new Case({ title, description, clientId, lawyerId: req.user.id });
    await newCase.save();

    const populated = await Case.findById(newCase._id).populate('clientId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// PATCH /api/cases/:id/status — lawyer only + ownership check + Zod validation
router.patch('/:id/status', verifyToken, requireRole('lawyer'), verifyCaseLawyer, validate(updateCaseStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Case.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('lawyerId', 'name email')
      .populate('clientId', 'name email');
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// DELETE /api/cases/:id — lawyer only + ownership check
router.delete('/:id', verifyToken, requireRole('lawyer'), verifyCaseLawyer, async (req, res) => {
  try {
    if (req.case.status !== 'Closed') {
      return res.status(400).json({
        error: { code: 'INVALID_STATE', message: 'Only closed cases can be deleted' }
      });
    }

    await Case.findByIdAndDelete(req.params.id);
    await Document.deleteMany({ caseId: req.params.id });
    await Deadline.deleteMany({ caseId: req.params.id });

    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
