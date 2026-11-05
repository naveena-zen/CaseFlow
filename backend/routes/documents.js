const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { verifyToken } = require('../middleware/auth');
const { verifyCaseAccess, verifyDocumentAccess } = require('../middleware/ownership');
const { logActivity } = require('../utils/activityLogger');

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

// POST /api/documents/upload/:caseId — upload document with versioning support
router.post('/upload/:caseId', verifyToken, verifyCaseAccess, handleMulterUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file was uploaded' } });
    }

    const caseId = req.params.caseId;
    const originalName = req.file.originalname;

    // Check if document with same originalName exists for this case
    let doc = await Document.findOne({ caseId, originalName });

    if (doc) {
      // Re-upload under same name -> Version bump
      doc.previousVersions.push({
        version: doc.version,
        filename: doc.filename,
        path: doc.path,
        uploadedAt: doc.updatedAt || new Date()
      });
      doc.version += 1;
      doc.filename = req.file.filename;
      doc.path = req.file.path;
      await doc.save();

      await logActivity({
        caseId,
        userId: req.user.id,
        action: 'DOCUMENT_VERSION_UPLOAD',
        description: `Uploaded version ${doc.version} of "${originalName}"`,
        details: { documentId: doc._id, version: doc.version }
      });

      return res.status(200).json(doc);
    } else {
      // New document
      doc = new Document({
        originalName,
        filename: req.file.filename,
        path: req.file.path,
        caseId,
        version: 1,
        previousVersions: []
      });

      await doc.save();

      await logActivity({
        caseId,
        userId: req.user.id,
        action: 'DOCUMENT_UPLOAD',
        description: `Uploaded document "${originalName}"`,
        details: { documentId: doc._id }
      });

      return res.status(201).json(doc);
    }
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/documents/:caseId — list documents for a case
router.get('/:caseId', verifyToken, verifyCaseAccess, async (req, res) => {
  try {
    const docs = await Document.find({ caseId: req.params.caseId }).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/documents/download/:docId — download latest or specific version
router.get('/download/:docId', verifyToken, verifyDocumentAccess, async (req, res) => {
  try {
    const doc = req.document;
    const requestedVersion = req.query.version ? parseInt(req.query.version, 10) : null;

    let filePath = doc.path;
    let fileName = doc.originalName;

    if (requestedVersion && requestedVersion !== doc.version) {
      const prev = doc.previousVersions.find((pv) => pv.version === requestedVersion);
      if (!prev) {
        return res.status(404).json({ error: { code: 'VERSION_NOT_FOUND', message: `Version ${requestedVersion} not found` } });
      }
      filePath = prev.path;
      fileName = `v${prev.version}_${doc.originalName}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'File not found on storage server' } });
    }

    res.download(filePath, fileName);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// DELETE /api/documents/:docId — delete document
router.delete('/:docId', verifyToken, verifyDocumentAccess, async (req, res) => {
  try {
    const doc = req.document;
    // Unlink latest file
    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }
    // Unlink previous version files
    if (doc.previousVersions && doc.previousVersions.length > 0) {
      doc.previousVersions.forEach((pv) => {
        if (fs.existsSync(pv.path)) {
          fs.unlinkSync(pv.path);
        }
      });
    }

    await Document.findByIdAndDelete(doc._id);

    await logActivity({
      caseId: doc.caseId,
      userId: req.user.id,
      action: 'DOCUMENT_DELETED',
      description: `Deleted document "${doc.originalName}"`
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
