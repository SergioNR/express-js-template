import { getUserCompanyPermissions } from '../models/roleModel.js';

export const checkCompanyPermission = (permissionName) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'The user is not authenticated',
    });
  }

  //* Company permissions come only from company roles. The platform
  //* superadmin role grants nothing inside a tenant company

  const userPermissions = await getUserCompanyPermissions(req.user.id);

  if (userPermissions.includes(permissionName)) {
    return next();
  }

  return res.status(403).json({
    message: 'User does not have the required permissions',
  });
};
