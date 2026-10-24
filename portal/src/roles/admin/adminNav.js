import {
  LayoutDashboard, Users, Briefcase, Building2, ShieldCheck,
  Lock, FileText, ClipboardCheck, BookOpen, Calculator,
  CheckSquare, AlertCircle, Bell, BarChart3, Settings
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const adminNav = [
  { label: 'Executive Overview', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { label: 'User & Role Mgmt', path: ROUTES.ADMIN.USERS, icon: Users },
  { label: 'Client & Projects', path: ROUTES.ADMIN.PROJECTS, icon: Briefcase },
  { label: 'Centre Master', path: ROUTES.ADMIN.CENTRES, icon: Building2 },
  { label: 'Eligibility & Blacklist', path: ROUTES.ADMIN.ELIGIBILITY, icon: ShieldCheck },
  { label: 'Booking & Locking', path: ROUTES.ADMIN.BOOKING, icon: Lock },
  { label: 'Document Mgmt', path: ROUTES.ADMIN.DOCUMENTS, icon: FileText },
  { label: 'Audit & Compliance', path: ROUTES.ADMIN.AUDIT, icon: ClipboardCheck },
  { label: 'Allocation Mgmt', path: ROUTES.ADMIN.ALLOCATION, icon: BookOpen },
  { label: 'Commercial & Cost', path: ROUTES.ADMIN.COMMERCIAL, icon: Calculator },
  { label: 'Readiness & Mock', path: ROUTES.ADMIN.READINESS, icon: CheckSquare },
  { label: 'Incident & Tickets', path: ROUTES.ADMIN.INCIDENTS, icon: AlertCircle },
  { label: 'Notifications', path: ROUTES.ADMIN.NOTIFICATIONS, icon: Bell },
  { label: 'MIS / Reports', path: ROUTES.ADMIN.REPORTS, icon: BarChart3 },
  { label: 'Audit Trail & Config', path: ROUTES.ADMIN.CONFIG, icon: Settings },
];

export default adminNav;
