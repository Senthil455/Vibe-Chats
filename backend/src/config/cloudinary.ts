import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: Express.Request, file: Express.Multer.File) => {
    let folder = 'vibeschat/misc';
    let resource_type: 'image' | 'video' | 'raw' = 'raw';

    if (file.mimetype.startsWith('image/')) {
      folder = 'vibeschat/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'vibeschat/videos';
      resource_type = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'vibeschat/audio';
      resource_type = 'video'; // Cloudinary uses video for audio
    } else {
      folder = 'vibeschat/documents';
    }

    return {
      folder,
      resource_type,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'mp3', 'ogg', 'pdf', 'doc', 'docx', 'txt'],
      transformation: resource_type === 'image' ? [{ quality: 'auto', fetch_format: 'auto' }] : undefined,
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export const deleteFromCloudinary = async (publicId: string, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType as 'image' | 'video' | 'raw' });
};
