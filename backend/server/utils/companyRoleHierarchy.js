//* Seeded company roles form a hierarchy: an owner can grant everything an
//* admin can, and an admin everything a member has. "Holding" a role for
//* granting purposes therefore means holding it or any superior role.
export const COMPANY_ROLE_HIERARCHY = {
  company_owner: ['company_owner', 'company_admin', 'company_member'],
  company_admin: ['company_admin', 'company_member'],
  company_member: ['company_member'],
};

export const rolesGrantableBy = (heldRoleNames) => {
  const grantableRoleNames = new Set();

  for (const heldRoleName of heldRoleNames) {
    for (const grantableRoleName of COMPANY_ROLE_HIERARCHY[heldRoleName] ?? []) {
      grantableRoleNames.add(grantableRoleName);
    }
  }

  return [...grantableRoleNames].sort();
};

export const canGrantRole = (heldRoleNames, targetRoleName) => rolesGrantableBy(heldRoleNames).includes(targetRoleName);
