import {
  Home, Building2, CalendarCheck, BookMarked, CheckSquare,
  AlertCircle, Receipt, Bell, MessageSquare, History, ShieldAlert
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const centreNav = [
  { label: 'Dashboard', path: ROUTES.CENTRE.DASHBOARD, icon: Home },
  { label: 'My Centre Profile', path: ROUTES.CENTRE.PROFILE, icon: Building2 },
  { label: 'Booking Request', path: ROUTES.CENTRE.BOOKING, icon: CalendarCheck },
  { label: 'Allocation', path: ROUTES.CENTRE.ALLOCATION, icon: BookMarked },
  { label: 'Readiness & Mock-Day', path: ROUTES.CENTRE.READINESS, icon: CheckSquare },
  { label: 'Exam-Day Updates', path: ROUTES.CENTRE.EXAMDAY, icon: AlertCircle },
  { label: 'Invoice Submission', path: ROUTES.CENTRE.INVOICE, icon: Receipt },
  { label: 'Notifications', path: ROUTES.CENTRE.NOTIFICATIONS, icon: Bell },
  { label: 'Support/Tickets', path: ROUTES.CENTRE.SUPPORT, icon: MessageSquare },
  { label: 'Centre History Logs', path: ROUTES.CENTRE.HISTORY, icon: History },
  { label: 'Policies', path: ROUTES.CENTRE.POLICIES, icon: ShieldAlert },
];

export default centreNav;
