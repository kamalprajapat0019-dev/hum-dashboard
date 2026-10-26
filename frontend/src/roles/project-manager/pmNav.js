import {
  LayoutDashboard, FolderOpen, Building2, ShieldCheck,
  FileText, ClipboardCheck, BookOpen, Calculator,
  CheckSquare, AlertCircle, Bell, Receipt, BarChart3
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const pmNav = [
  { label: 'My Projects', path: ROUTES.PM.DASHBOARD, icon: LayoutDashboard },
  { label: 'Project Setup', path: ROUTES.PM.SETUP, icon: FolderOpen },
  { label: 'Centre Pipeline', path: ROUTES.PM.PIPELINE, icon: Building2 },
  { label: 'Eligibility Review', path: ROUTES.PM.ELIGIBILITY, icon: ShieldCheck },
  { label: 'Consent & Docs', path: ROUTES.PM.CONSENT, icon: FileText },
  { label: 'Audit & Mock View', path: ROUTES.PM.AUDIT, icon: ClipboardCheck },
  { label: 'Allocation Mgmt', path: ROUTES.PM.ALLOCATION, icon: BookOpen },
  { label: 'Commercial Review', path: ROUTES.PM.COMMERCIAL, icon: Calculator },
  { label: 'Readiness & Exam', path: ROUTES.PM.READINESS, icon: CheckSquare },
  { label: 'Incidents / Escalations', path: ROUTES.PM.INCIDENTS, icon: AlertCircle },
  { label: 'Notifications', path: ROUTES.PM.NOTIFICATIONS, icon: Bell },
  { label: 'Invoice & Closure', path: ROUTES.PM.INVOICE, icon: Receipt },
  { label: 'Project MIS', path: ROUTES.PM.REPORTS, icon: BarChart3 },
];

export default pmNav;
