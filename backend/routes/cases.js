const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const Deadline = require('../models/Deadline');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { verifyCaseAccess, verifyCaseLawyer } = require('../middleware/ownership');
const { createCaseSchema, updateCaseStatusSchema } = require('../validators');
const { logActivity } = require('../utils/activityLogger');

// GET /api/cases — search, filter, pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const isPaginated = page !== undefined || limit !== undefined || status !== undefined || search !== undefined;

    let query = {};
    if (req.user.role === 'lawyer') {
      query.lawyerId = req.user.id;
    } else {
      query.clientId = req.user.id;
    }

    if (status && ['Open', 'Active', 'Closed'].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      // Find matching client or lawyer users first to allow search by user name
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { clientId: { $in: userIds } },
        { lawyerId: { $in: userIds } }
      ];
    }

    if (!isPaginated) {
      // Legacy simple array response
      const cases = await Case.find(query)
        .populate('lawyerId', 'name email')
        .populate('clientId', 'name email')
        .sort({ updatedAt: -1 });
      return res.json(cases);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [cases, total] = await Promise.all([
      Case.find(query)
        .populate('lawyerId', 'name email')
        .populate('clientId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Case.countDocuments(query)
    ]);

    res.json({
      cases,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/cases/analytics/summary — dashboard analytics
router.get('/analytics/summary', verifyToken, async (req, res) => {
  try {
    let caseQuery = {};
    if (req.user.role === 'lawyer') {
      caseQuery.lawyerId = req.user.id;
    } else {
      caseQuery.clientId = req.user.id;
    }

    const userCases = await Case.find(caseQuery).select('_id status');
    const caseIds = userCases.map((c) => c._id);

    const statusBreakdown = { Open: 0, Active: 0, Closed: 0 };
    userCases.forEach((c) => {
      if (statusBreakdown[c.status] !== undefined) {
        statusBreakdown[c.status]++;
      }
    });

    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const upcomingDeadlines = await Deadline.find({
      caseId: { $in: caseIds },
      dueDate: { $gte: now, $lte: fourteenDaysLater }
    })
      .populate({ path: 'caseId', select: 'title' })
      .sort({ dueDate: 1 });

    res.json({
      totalCases: userCases.length,
      statusBreakdown,
      upcomingDeadlines
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/cases/:id/activity — audit trail timeline
router.get('/:id/activity', verifyToken, verifyCaseAccess, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ caseId: req.params.id })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/cases/:id — single case with ownership check
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

// POST /api/cases — lawyer only + Zod validation + Activity Logging
router.post('/', verifyToken, requireRole('lawyer'), validate(createCaseSchema), async (req, res) => {
  try {
    const { title, description, clientId } = req.body;

    const clientUser = await User.findById(clientId);
    if (!clientUser || clientUser.role !== 'client') {
      return res.status(400).json({
        error: { code: 'INVALID_CLIENT', message: 'Target client does not exist or is not a client user' }
      });
    }

    const newCase = new Case({ title, description, clientId, lawyerId: req.user.id });
    await newCase.save();

    await logActivity({
      caseId: newCase._id,
      userId: req.user.id,
      action: 'CASE_CREATED',
      description: `Case "${newCase.title}" created`
    });

    const populated = await Case.findById(newCase._id).populate('clientId', 'name email').populate('lawyerId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// PATCH /api/cases/:id/status — lawyer only + ownership check + Zod validation + Activity Logging
router.patch('/:id/status', verifyToken, requireRole('lawyer'), verifyCaseLawyer, validate(updateCaseStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const oldStatus = req.case.status;
    const updated = await Case.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('lawyerId', 'name email')
      .populate('clientId', 'name email');

    await logActivity({
      caseId: updated._id,
      userId: req.user.id,
      action: 'STATUS_CHANGE',
      description: `Case status changed from ${oldStatus} to ${status}`,
      details: { oldStatus, newStatus: status }
    });

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
    await ActivityLog.deleteMany({ caseId: req.params.id });

    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
