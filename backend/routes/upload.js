const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `artifact_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('只允许上传图片文件（jpg/png/gif/webp）'));
  },
});

router.post('/', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '请选择图片文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, message: '上传成功' });
});

router.use((err, req, res, next) => {
  res.status(400).json({ message: err.message });
});

module.exports = router;
