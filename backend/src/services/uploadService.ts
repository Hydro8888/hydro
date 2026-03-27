import { Client } from 'minio';
import { randomUUID } from 'crypto';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minio_admin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minio_secret_2026',
});

const BUCKET = process.env.MINIO_BUCKET || 'yeoualba-uploads';

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    // Set public read policy
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    };
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  }
}

export async function uploadFile(file: Express.Multer.File): Promise<string> {
  await ensureBucket();

  const ext = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const objectName = `uploads/${fileName}`;

  await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });

  const endpoint = process.env.MINIO_ENDPOINT || 'minio';
  const port = process.env.MINIO_PORT || '9000';
  return `http://${endpoint}:${port}/${BUCKET}/${objectName}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const objectName = fileUrl.split(`/${BUCKET}/`)[1];
  if (objectName) {
    await minioClient.removeObject(BUCKET, objectName);
  }
}
