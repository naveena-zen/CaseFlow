const mongoose = require('mongoose');
const Case = require('../models/Case');
const Document = require('../models/Document');
const Deadline = require('../models/Deadline');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const verifyCaseAccess = async (req, res, next) => {
  try {
    const caseId = req.params.id || req.params.caseId;
    if (!caseId || !isValidObjectId(caseId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid Case ID format' } });
    }

    const c = await Case.findById(caseId);
    if (!c) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    const userIdStr = req.user.id.toString();
    const lawyerIdStr = c.lawyerId ? c.lawyerId.toString() : '';
    const clientIdStr = c.clientId ? c.clientId.toString() : '';

    if (userIdStr !== lawyerIdStr && userIdStr !== clientIdStr) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: You are not authorized to view or edit this case' } });
    }

    req.case = c;
    next();
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const verifyCaseLawyer = async (req, res, next) => {
  try {
    const caseId = req.params.id || req.params.caseId;
    if (!caseId || !isValidObjectId(caseId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid Case ID format' } });
    }

    const c = await Case.findById(caseId);
    if (!c) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    if (c.lawyerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: Only the assigned lawyer can perform this action' } });
    }

    req.case = c;
    next();
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const verifyDocumentAccess = async (req, res, next) => {
  try {
    const docId = req.params.docId || req.params.id;
    if (!docId || !isValidObjectId(docId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid Document ID format' } });
    }

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    const c = await Case.findById(doc.caseId);
    if (!c) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Associated case not found' } });
    }

    const userIdStr = req.user.id.toString();
    const isLawyer = c.lawyerId && c.lawyerId.toString() === userIdStr;
    const isClient = c.clientId && c.clientId.toString() === userIdStr;

    if (!isLawyer && !isClient) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this document' } });
    }

    req.document = doc;
    req.case = c;
    next();
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

const verifyDeadlineAccess = async (req, res, next) => {
  try {
    const deadlineId = req.params.id || req.params.deadlineId;
    if (!deadlineId || !isValidObjectId(deadlineId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid Deadline ID format' } });
    }

    const deadline = await Deadline.findById(deadlineId);
    if (!deadline) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Deadline not found' } });
    }

    const c = await Case.findById(deadline.caseId);
    if (!c) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Associated case not found' } });
    }

    const userIdStr = req.user.id.toString();
    const isLawyer = c.lawyerId && c.lawyerId.toString() === userIdStr;
    const isClient = c.clientId && c.clientId.toString() === userIdStr;

    if (!isLawyer && !isClient) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this deadline' } });
    }

    req.deadline = deadline;
    req.case = c;
    next();
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

module.exports = {
  verifyCaseAccess,
  verifyCaseLawyer,
  verifyDocumentAccess,
  verifyDeadlineAccess
};
