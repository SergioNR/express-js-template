import { jest } from '@jest/globals';

//* The generated Prisma client needs a live database, so `$transaction` runs
//* the callback against a mocked interactive-transaction client (`tx`)
const tx = {
  $queryRaw: jest.fn(),
  user: {
    findFirst: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  userRole: {
    findMany: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
  },
};

jest.unstable_mockModule('../server/config/prismaClient.js', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback(tx)),
  },
}));

jest.unstable_mockModule('../server/models/posthogModel.js', () => ({
  posthogUserSignedUp: jest.fn(),
  posthogUserDeleteAccount: jest.fn(),
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

const { deleteUserWithCompanyDataInDb } = await import('../server/models/userModel.js');

describe('deleteUserWithCompanyDataInDb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a superadmin without a company and never touches company data', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 'staff-1', company_id: null });
    tx.user.delete.mockResolvedValue({ id: 'staff-1', role: 'superadmin' });

    const result = await deleteUserWithCompanyDataInDb('staff-1', { protectLastOwner: true });

    expect(result).toEqual({
      status: 'deleted',
      deletedUser: { id: 'staff-1', role: 'superadmin' },
      companyDeleted: false,
      subscription: null,
      fileKeys: [],
    });
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'staff-1' } });
    //* A `company_id: null` count would match every other superadmin
    expect(tx.user.count).not.toHaveBeenCalled();
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns not_found when the user does not exist', async () => {
    tx.user.findFirst.mockResolvedValue(null);

    const result = await deleteUserWithCompanyDataInDb('missing');

    expect(result).toEqual({ status: 'not_found' });
    expect(tx.user.delete).not.toHaveBeenCalled();
  });
});
