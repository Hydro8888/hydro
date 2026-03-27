import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadFile } from '../services/uploadService';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)'));
    }
  },
});

// POST /api/upload
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '파일이 필요합니다.' });
      return;
    }
    const url = await uploadFile(req.file);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/multiple
router.post('/multiple', authenticate, upload.array('files', 10), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: '파일이 필요합니다.' });
      return;
    }
    const urls = await Promise.all(files.map(uploadFile));
    res.json({ urls });
  } catch (err) {
    next(err);
  }
});

export default router;
