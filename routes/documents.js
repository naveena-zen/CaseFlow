const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { verifyToken } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST /api/documents/upload/:caseId
router.post('/upload/:caseId', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const doc = new Document({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      caseId: req.params.caseId
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/documents/download/:docId
router.get('/download/:docId', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    res.download(doc.path, doc.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/documents/:caseId
router.get('/:caseId', verifyToken, async (req, res) => {
  try {
    const docs = await Document.find({ caseId: req.params.caseId });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/documents/:docId
router.delete('/:docId', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (doc) {
      if (fs.existsSync(doc.path)) fs.unlinkSync(doc.path);
      await Document.findByIdAndDelete(req.params.docId);
    }
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
