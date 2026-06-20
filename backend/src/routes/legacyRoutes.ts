import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import LegacyController from '../controllers/LegacyController';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.get('/', (req, res) => LegacyController.handle(req, res));
router.post(
  '/',
  upload.fields([
    { name: 'images[]', maxCount: 20 },
    { name: 'avatar', maxCount: 1 },
  ]),
  (req, res) => LegacyController.handle(req, res)
);

export default router;
