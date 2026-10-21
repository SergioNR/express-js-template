import { getUserCompanyPermissions } from '../models/roleModel.js';

export const checkCompanyPermission = (permissionName) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'The user is not authenticated',
    });
  }

  //* Global admins are platform superusers and bypass company permission
  //* checks, mirroring the checkPermissionByRole bypass
  if (req.user.role === 'admin') {
    return next();
  }

  const userPermissions = await getUserCompanyPermissions(req.user.id);

  if (userPermissions.includes(permissionName)) {
    return next();
  }

  return res.status(403).json({
    message: 'User does not have the required permissions',
  });
};
