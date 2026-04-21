import { Router } from 'express';
import { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { upload, deleteFromCloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  res.json({
    url: (req.file as any).path,
    publicId: (req.file as any).filename,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });
}));

router.delete('/delete', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { publicId, resourceType } = req.body;
  if (!publicId) throw new AppError('publicId required', 400);
  await deleteFromCloudinary(publicId, resourceType || 'image');
  res.json({ message: 'File deleted' });
}));

export default router;
