// config/cloudinary.js
const { v4: uuid } = require('uuid');
const mime = require('mime-types');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload local file to Cloudinary and return public HTTPS URL.
 * - images -> resource_type: 'image'
 * - videos -> resource_type: 'video'
 * - pdf/others -> resource_type: 'raw' (works with pdf.js)
 */
async function uploadToCloudinary(localPath, folder = process.env.CLOUDINARY_FOLDER || 'ecolearn') {
  const ext = (localPath.split('.').pop() || '').toLowerCase();
  const mimeType = mime.lookup(ext) || 'application/octet-stream';
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const publicId = `${folder}/${uuid()}`;

  const res = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    overwrite: true,
    resource_type: isImage ? 'image' : (isVideo ? 'video' : 'raw'),
  });

  try { fs.unlinkSync(localPath); } catch {}
  return res.secure_url;
}

module.exports = { cloudinary, uploadToCloudinary };
