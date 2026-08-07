const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { verifyToken } = require('../middleware/auth');
const { verifyCaseAccess, verifyDocumentAccess } = require('../middleware/ownership');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniquePrefix}-${sanitizedOriginal}`);
  }
});

// File filter for security
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE: File type not allowed. Supported formats: PDF, PNG, JPEG, WEBP, DOC, DOCX, TXT'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Wrapper middleware for multer error handling
const handleMulterUpload = (req, res, next) => {
  const singleUpload = upload.single('file');
  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds maximum limit of 5MB' }
        });
      }
      return res.status(400).json({
        error: { code: 'UPLOAD_ERROR', message: err.message }
      });
    } else if (err) {
      return res.status(400).json({
        error: { code: 'INVALID_FILE_TYPE', message: err.message.replace('INVALID_FILE_TYPE: ', '') }
      });
    }
    next();
  });
};

// POST /api/documents/upload/:caseId — upload document to a case (lawyer or client)
router.post('/upload/:caseId', verifyToken, verifyCaseAccess, handleMulterUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file was uploaded' } });
    }

    const doc = new Document({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      caseId: req.params.caseId
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/documents/:caseId — list documents for a case
router.get('/:caseId', verifyToken, verifyCaseAccess, async (req, res) => {
  try {
    const docs = await Document.find({ caseId: req.params.caseId });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/documents/download/:docId — download a document file
router.get('/download/:docId', verifyToken, verifyDocumentAccess, async (req, res) => {
  try {
    const doc = req.document;
    if (!fs.existsSync(doc.path)) {
      return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'File not found on storage server' } });
    }
    res.download(doc.path, doc.originalName);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// DELETE /api/documents/:docId — delete document
router.delete('/:docId', verifyToken, verifyDocumentAccess, async (req, res) => {
  try {
    const doc = req.document;
    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }
    await Document.findByIdAndDelete(doc._id);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
