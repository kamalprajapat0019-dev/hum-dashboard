import {
  LayoutDashboard, CalendarCheck, MessageSquare, FileText,
  BookOpen, CheckSquare, AlertCircle, Truck, Bell
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const opsNav = [
  { label: 'Operations Board', path: ROUTES.OPS.DASHBOARD, icon: LayoutDashboard },
  { label: 'Booking & Centres', path: ROUTES.OPS.BOOKING, icon: CalendarCheck },
  { label: 'Consent Mgmt', path: ROUTES.OPS.CONSENT, icon: MessageSquare },
  { label: 'Document Checklist', path: ROUTES.OPS.DOCUMENTS, icon: FileText },
  { label: 'Allocation', path: ROUTES.OPS.ALLOCATION, icon: BookOpen },
  { label: 'Readiness', path: ROUTES.OPS.READINESS, icon: CheckSquare },
  { label: 'Incidents & Tickets', path: ROUTES.OPS.INCIDENTS, icon: AlertCircle },
  { label: 'Inventory', path: ROUTES.OPS.INVENTORY, icon: Truck },
  { label: 'Notifications', path: ROUTES.OPS.NOTIFICATIONS, icon: Bell },
];

export default opsNav;
