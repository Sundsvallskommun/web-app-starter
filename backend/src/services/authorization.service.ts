// import { AUTHORIZED_GROUPS } from '@/config';
import { ADRole, InternalRole, Permissions } from '@interfaces/auth.interface';

// export function authorizeGroups(groups) {
//   const authorizedGroupsList = AUTHORIZED_GROUPS.split(',');
//   const groupsList = groups.split(',').map((g: string) => g.toLowerCase());
//   return authorizedGroupsList.some(authorizedGroup => groupsList.includes(authorizedGroup));
// }

export const defaultPermissions: () => Permissions = () => ({
  canEditSystemMessages: false,
});

enum RoleOrderEnum {
  'app_read',
  'app_admin',
}

const roles = new Map<InternalRole, Partial<Permissions>>([
  [
    'app_admin',
    {
      canEditSystemMessages: true,
    },
  ],
  ['app_read', {}],
]);

type RoleADMapping = Record<ADRole, InternalRole>;
const roleADMapping: RoleADMapping = {
  sg_appl_app_read: 'app_read',
  sg_appl_app_admin: 'app_admin',
};

/**
 *
 * @param groups Array of groups/roles
 * @param internalGroups Whether to use internal groups or external group-mappings
 * @returns collected permissions for all matching role groups
 */
export const getPermissions = (groups: InternalRole[] | ADRole[], internalGroups = false): Permissions => {
  const permissions: Permissions = defaultPermissions();
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = internalGroups ? (groupLower as InternalRole) : roleADMapping[groupLower as ADRole];
    const groupPermissions = roles.get(role);
    if (groupPermissions) {
      (Object.keys(groupPermissions) as (keyof Permissions)[]).forEach(permission => {
        if (groupPermissions[permission] === true) {
          permissions[permission] = true;
        }
      });
    }
  });
  return permissions;
};

/**
 * Ensures to return only the role with most permissions
 * @param groups List of AD roles
 * @returns role with most permissions
 */
export const getRole = (groups: ADRole[]): InternalRole | undefined => {
  const firstGroup = groups[0];
  if (groups.length === 1 && firstGroup) return roleADMapping[firstGroup]; // app_read

  const matchedRoles: InternalRole[] = [];
  groups.forEach(group => {
    const groupLower = group.toLowerCase() as ADRole;
    const role = roleADMapping[groupLower];
    if (role) {
      matchedRoles.push(role);
    }
  });

  return matchedRoles.sort((a, b) => (RoleOrderEnum[a] > RoleOrderEnum[b] ? 1 : 0))[0];
};
