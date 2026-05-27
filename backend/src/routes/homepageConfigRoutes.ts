import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import HomepageConfigController from '../controllers/HomepageConfigController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({ storage });

router.get('/', (req, res) => HomepageConfigController.getHomepageImages(req, res));
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.fields([
    ...Array.from({ length: 7 }, (_, i) => ({ name: `gallery_${i + 1}`, maxCount: 1 })),
    ...Array.from({ length: 3 }, (_, i) => ({ name: `header_${i + 1}`, maxCount: 1 })),
    { name: 'consult_image', maxCount: 1 },
    { name: 'hero_background', maxCount: 1 },
  ]),
  (req, res) => HomepageConfigController.saveHomepageImages(req, res)
);

export default router;
