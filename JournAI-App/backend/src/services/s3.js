import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  // For local development with LocalStack or MinIO, you can set the endpoint
  // endpoint: process.env.S3_ENDPOINT,
  // forcePathStyle: true
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Upload a file to S3
 * @param {Object} file - The file object from multer
 * @param {string} prefix - Optional prefix for the S3 key (e.g., 'users/123/')
 * @returns {Promise<string>} The S3 key
 */
export async function uploadToS3(file, prefix = '') {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object');
  }

  const fileExtension = file.originalname.split('.').pop();
  const key = `${prefix}${uuidv4()}.${fileExtension}`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private',
    Metadata: {
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype
    }
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`Successfully uploaded file to S3: ${key}`);
    return key;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Get a signed URL for a file in S3
 * @param {string} key - The S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrlForFile(key, expiresIn = 3600) {
  if (!key) {
    throw new Error('S3 key is required');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Delete a file from S3
 * @param {string} key - The S3 object key
 * @returns {Promise<void>}
 */
export async function deleteFromS3(key) {
  if (!key) {
    throw new Error('S3 key is required');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  try {
    await s3Client.send(command);
    console.log(`Successfully deleted file from S3: ${key}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
}

/**
 * Check if a file exists in S3
 * @param {string} key - The S3 object key
 * @returns {Promise<boolean>}
 */
export async function fileExistsInS3(key) {
  if (!key) return false;
  
  try {
    await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

export default {
  uploadToS3,
  getSignedUrlForFile,
  deleteFromS3,
  fileExistsInS3
};
