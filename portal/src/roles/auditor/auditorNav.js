import {
  LayoutDashboard, ClipboardCheck, ShieldCheck, CheckSquare, FileWarning, Bell
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const auditorNav = [
  { label: 'My Audits', path: ROUTES.AUDITOR.DASHBOARD, icon: LayoutDashboard },
  { label: 'Audit Assignments', path: ROUTES.AUDITOR.AUDITS, icon: ClipboardCheck },
  { label: 'Technical Scan', path: ROUTES.AUDITOR.SCAN, icon: ShieldCheck },
  { label: 'Mock Status', path: ROUTES.AUDITOR.MOCK, icon: CheckSquare },
  { label: 'Findings & Evidence', path: ROUTES.AUDITOR.FINDINGS, icon: FileWarning },
  { label: 'Notifications', path: ROUTES.AUDITOR.NOTIFICATIONS, icon: Bell },
];

export default auditorNav;
