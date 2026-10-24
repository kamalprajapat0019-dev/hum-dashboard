import { ROLES } from '../constants/roles';
import { adminNav } from './admin/adminNav';
import { pmNav } from './project-manager/pmNav';
import { auditorNav } from './auditor/auditorNav';
import { opsNav } from './operations/opsNav';
import { financeNav } from './finance/financeNav';
import { centreNav } from './centre-user/centreNav';

export const ROLE_NAVIGATION = {
  [ROLES.ADMIN]: adminNav,
  [ROLES.PM]: pmNav,
  [ROLES.AUDITOR]: auditorNav,
  [ROLES.OPERATIONS]: opsNav,
  [ROLES.FINANCE]: financeNav,
  [ROLES.CENTRE]: centreNav,
};

export default ROLE_NAVIGATION;
