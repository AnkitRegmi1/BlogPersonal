const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('./aws');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.AWS_REGION || 'us-east-1';

if (!BUCKET) {
  console.warn('S3_BUCKET not set; S3 uploads will fail.');
}

/**
 * Upload a buffer to S3 and return the public URL.
 * keyPrefix e.g. "images" or "covers"
 */
async function uploadBuffer(buffer, mimeType, keyPrefix = 'images') {
  if (!BUCKET) throw new Error('S3_BUCKET is not configured');
  const m = mimeType || '';
  const ext = m.includes('png') ? 'png' : m.includes('gif') ? 'gif' : m.includes('webp') ? 'webp' : 'jpg';
  const key = `${keyPrefix}/${uuidv4()}.${ext}`;
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'image/jpeg',
  });
  await s3Client.send(cmd);
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Upload from multer file (req.file) and return public URL.
 */
async function uploadFromMulterFile(file) {
  if (!file || (!file.buffer && !file.path)) {
    throw new Error('No file provided');
  }
  const buffer = file.buffer || fs.readFileSync(file.path);
  const mime = file.mimetype || 'image/jpeg';
  return uploadBuffer(buffer, mime, 'covers');
}

module.exports = {
  uploadBuffer,
  uploadFromMulterFile,
};
