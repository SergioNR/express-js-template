import { prisma } from '../config/prismaClient.js';

export const deleteCompanyInDb = async (companyId) => {
  await prisma.company.delete({
    where: {
      id: companyId,
    },
  });
};
