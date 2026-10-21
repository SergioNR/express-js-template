import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { S3_BUCKET, s3Client } from '../../config/s3.js';

//* Reads the stored object's metadata so an upload can be verified against
//* the declared size and MIME type. Resolves to null when the object does
//* not exist (upload not done yet); any other provider error is thrown
export const headS3Object = async (s3Key) => {
  try {
    const response = await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    }));

    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }

    throw error;
  }
};
