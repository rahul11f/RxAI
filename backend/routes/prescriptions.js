const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const { validatePrescription } = require('../services/validationService');
const router = express.Router();

// In-memory store (use PostgreSQL in production)
const STORE = [];

const os = require('os');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename:    (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /\.(jpe?g|png|gif|bmp|tiff?|pdf)$/i.test(file.originalname)
      ? cb(null, true)
      : cb(new Error('Only image files allowed'));
  },
});

// POST /api/prescriptions/validate
router.post('/validate', upload.single('image'), async (req, res) => {
  try {
    const imagePath  = req.file?.path || null;
    const manualText = req.body.text  || null;

    if (!imagePath && !manualText) {
      return res.status(400).json({ error: 'Provide an image file or prescription text' });
    }

    const result = await validatePrescription(imagePath, manualText);
    const rx = { id: `RX-${Date.now()}`, createdAt: new Date().toISOString(), imagePath: req.file?.filename || null, ...result };
    STORE.unshift(rx);

    res.json({ success: true, data: rx });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prescriptions
router.get('/', (req, res) => res.json({ count: STORE.length, data: STORE }));

// GET /api/prescriptions/:id
router.get('/:id', (req, res) => {
  const rx = STORE.find(p => p.id === req.params.id);
  rx ? res.json({ data: rx }) : res.status(404).json({ error: 'Not found' });
});

module.exports = router;
