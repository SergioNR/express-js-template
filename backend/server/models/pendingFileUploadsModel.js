import { prisma } from '../config/prismaClient.js';

//* Keys of upload rows that never got confirmed - the cleanup job removes the
//* bucket objects first and only then deletes the rows (see
//* cron/deletePendingFileUploadsScheduler.js)
export const getStalePendingFileKeysInDb = async (createdBefore) => {
  const staleFiles = await prisma.file.findMany({
    where: {
      status: 'pending',
      created_at: {
        lt: createdBefore,
      },
    },
    select: {
      s3_key: true,
    },
  });

  return staleFiles.map((file) => file.s3_key);
};

//* Still filtered on `pending` so a row confirmed between the key listing and
//* this delete is left alone. Resolves to the number of deleted rows
export const deletePendingFilesByKeysInDb = async (s3Keys) => {
  if (s3Keys.length === 0) {
    return 0;
  }

  const deleteResult = await prisma.file.deleteMany({
    where: {
      status: 'pending',
      s3_key: {
        in: s3Keys,
      },
    },
  });

  return deleteResult.count;
};
