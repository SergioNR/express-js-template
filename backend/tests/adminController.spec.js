import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/userModel.js', () => ({
  deleteUserInDb: jest.fn(),
  getAllUsersInDb: jest.fn(),
  countUsersInDb: jest.fn(),
  getUserById: jest.fn(),
  getUserDetailInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/companyModel.js', () => ({
  getAllCompaniesInDb: jest.fn(),
  countCompaniesInDb: jest.fn(),
  getCompanyDetailInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/subscriptionModel.js', () => ({
  countActiveSubscriptionsInDb: jest.fn(),
  countTotalSubscriptionsInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/sessionModel.js', () => ({
  countActiveSessionsInDb: jest.fn(),
  countActiveSessionsByUserInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/utils/userDeletionCleanup.js', () => ({
  cleanupAfterUserDeletion: jest.fn().mockResolvedValue(undefined),
}));

const {
  deleteOneUserById,
  getAdminStats,
  getAllCompanies,
  getAllUsers,
  getOneCompanyById,
  getOneUserById,
} = await import('../server/controllers/adminController.js');
const {
  deleteUserInDb,
  getAllUsersInDb,
  countUsersInDb,
  getUserById,
  getUserDetailInDb,
} = await import('../server/models/userModel.js');
const {
  getAllCompaniesInDb,
  countCompaniesInDb,
  getCompanyDetailInDb,
} = await import('../server/models/companyModel.js');
const {
  countActiveSubscriptionsInDb,
  countTotalSubscriptionsInDb,
} = await import('../server/models/subscriptionModel.js');
const {
  countActiveSessionsInDb,
  countActiveSessionsByUserInDb,
} = await import('../server/models/sessionModel.js');
const { cleanupAfterUserDeletion } = await import('../server/utils/userDeletionCleanup.js');

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

const userSummary = (id, email) => ({
  id,
  email,
  role: 'user',
  created_at: '2026-01-01T00:00:00.000Z',
  Company: { id: `company-${id}`, name: 'Acme' },
});

describe('getAllUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes only whitelisted filters and pagination to the model', async () => {
    getAllUsersInDb.mockResolvedValue([]);
    countUsersInDb.mockResolvedValue(0);
    const res = mockRes();

    await getAllUsers(
      {
        query: {
          role: 'admin', search: 'acme@test.com', hackerParam: 'DROP TABLE', limit: '10',
        },
      },
      res,
    );

    expect(getAllUsersInDb).toHaveBeenCalledWith(
      {
        role: 'admin',
        email: { contains: 'acme@test.com', mode: 'insensitive' },
      },
      { limit: 10, cursor: undefined },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, userCount: 0, users: [] }),
    );
  });

  it('returns nextCursor when the page is full', async () => {
    const users = Array.from({ length: 2 }, (_, i) => userSummary(`user-${i}`, `u${i}@test.com`));
    getAllUsersInDb.mockResolvedValue(users);
    countUsersInDb.mockResolvedValue(10);
    const res = mockRes();

    await getAllUsers({ query: { limit: '2' } }, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ users, nextCursor: 'user-1' }),
    );
  });

  it('omits nextCursor when the page is not full', async () => {
    getAllUsersInDb.mockResolvedValue([userSummary('user-0', 'u0@test.com')]);
    countUsersInDb.mockResolvedValue(1);
    const res = mockRes();

    await getAllUsers({ query: {} }, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ nextCursor: undefined }),
    );
  });
});

describe('getOneUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when the user does not exist', async () => {
    getUserDetailInDb.mockResolvedValue(null);
    const res = mockRes();

    await getOneUserById({ params: { userId: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(countActiveSessionsByUserInDb).not.toHaveBeenCalled();
  });

  it('returns the user detail with the active session count', async () => {
    const detail = {
      id: 'user-1',
      email: 'user@test.com',
      role: 'user',
      company: {
        id: 'company-1', name: 'Acme', stripeLinked: true, subscription: null,
      },
    };
    getUserDetailInDb.mockResolvedValue(detail);
    countActiveSessionsByUserInDb.mockResolvedValue(2);
    const res = mockRes();

    await getOneUserById({ params: { userId: 'user-1' } }, res);

    expect(countActiveSessionsByUserInDb).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User successfully retrieved - DB',
      user: { ...detail, activeSessionCount: 2 },
    });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('password');
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('stripe_id');
  });
});

describe('deleteOneUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuses self-deletion with 409', async () => {
    const res = mockRes();

    await deleteOneUserById({ params: { userId: 'admin-1' }, user: { id: 'admin-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteUserInDb).not.toHaveBeenCalled();
  });

  it('returns 404 when the user does not exist', async () => {
    getUserById.mockResolvedValue(null);
    const res = mockRes();

    await deleteOneUserById({ params: { userId: 'ghost' }, user: { id: 'admin-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes, runs the shared cleanup and returns the deleted id', async () => {
    getUserById.mockResolvedValue({ id: 'user-1' });
    deleteUserInDb.mockResolvedValue({ id: 'user-1', company_id: 'company-1' });
    const res = mockRes();

    await deleteOneUserById({ params: { userId: 'user-1' }, user: { id: 'admin-1' } }, res);

    expect(cleanupAfterUserDeletion).toHaveBeenCalledWith({ id: 'user-1', company_id: 'company-1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, userId: 'user-1' }),
    );
  });

  it('maps the Prisma FK constraint error to 409', async () => {
    getUserById.mockResolvedValue({ id: 'user-1' });
    deleteUserInDb.mockRejectedValue(Object.assign(new Error('fk'), { code: 'P2003' }));
    const res = mockRes();

    await deleteOneUserById({ params: { userId: 'user-1' }, user: { id: 'admin-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('getAllCompanies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes only the whitelisted name search to the model', async () => {
    getAllCompaniesInDb.mockResolvedValue([]);
    countCompaniesInDb.mockResolvedValue(0);
    const res = mockRes();

    await getAllCompanies({ query: { search: 'acme', junk: '1' } }, res);

    expect(getAllCompaniesInDb).toHaveBeenCalledWith(
      { name: { contains: 'acme', mode: 'insensitive' } },
      { limit: 50, cursor: undefined },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, companyCount: 0, companies: [] }),
    );
  });
});

describe('getOneCompanyById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when the company does not exist', async () => {
    getCompanyDetailInDb.mockResolvedValue(null);
    const res = mockRes();

    await getOneCompanyById({ params: { companyId: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the company detail envelope', async () => {
    const detail = {
      id: 'company-1',
      name: 'Acme',
      stripeLinked: false,
      subscription: { id: 'sub-1', expires_at: null },
      users: [{ id: 'user-1', email: 'user@test.com', role: 'user' }],
    };
    getCompanyDetailInDb.mockResolvedValue(detail);
    const res = mockRes();

    await getOneCompanyById({ params: { companyId: 'company-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Company successfully retrieved - DB',
      company: detail,
    });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('stripe_id');
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('password');
  });
});

describe('getAdminStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('composes all counters into the stats envelope', async () => {
    countUsersInDb.mockImplementation(async (filters = {}) => {
      if (filters.role === 'admin') return 2;
      if (filters.created_at) return 3;
      return 10;
    });
    countCompaniesInDb.mockResolvedValue(4);
    countTotalSubscriptionsInDb.mockResolvedValue(5);
    countActiveSubscriptionsInDb.mockResolvedValue(3);
    countActiveSessionsInDb.mockResolvedValue(7);
    const res = mockRes();

    await getAdminStats({}, res);

    expect(countUsersInDb).toHaveBeenCalledTimes(3);
    expect(countActiveSubscriptionsInDb).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Stats successfully retrieved - DB',
      stats: {
        totalUsers: 10,
        totalAdmins: 2,
        newUsersLastWeek: 3,
        totalCompanies: 4,
        totalSubscriptions: 5,
        activeSubscriptions: 3,
        activeSessions: 7,
      },
    });
  });
});
