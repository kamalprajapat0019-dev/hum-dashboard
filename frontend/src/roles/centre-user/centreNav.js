import {
  Home, Building2, CalendarCheck, UserCheck, FileText,
  Settings, Calculator, FileBadge, BookMarked, CheckSquare,
  AlertCircle, Receipt, MessageSquare, History
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const centreNav = [
  { label: 'Centre Dashboard', path: ROUTES.CENTRE.DASHBOARD, icon: Home },
  { label: 'My Centre Profile', path: ROUTES.CENTRE.PROFILE, icon: Building2 },
  { label: 'Booking Requests', path: ROUTES.CENTRE.BOOKING, icon: CalendarCheck },
  { label: 'Digital Consent', path: ROUTES.CENTRE.CONSENT, icon: UserCheck },
  { label: 'Document Checklist', path: ROUTES.CENTRE.DOCUMENTS, icon: FileText },
  { label: 'Infrastructure Form', path: ROUTES.CENTRE.INFRA, icon: Settings },
  { label: 'Quotation & Commercials', path: ROUTES.CENTRE.QUOTATION, icon: Calculator },
  { label: 'MoU & Undertaking', path: ROUTES.CENTRE.MOU, icon: FileBadge },
  { label: 'Allocation View', path: ROUTES.CENTRE.ALLOCATION, icon: BookMarked },
  { label: 'Readiness Confirm', path: ROUTES.CENTRE.READINESS, icon: CheckSquare },
  { label: 'Exam-Day Updates', path: ROUTES.CENTRE.EXAMDAY, icon: AlertCircle },
  { label: 'Invoice Submission', path: ROUTES.CENTRE.INVOICE, icon: Receipt },
  { label: 'Support / Tickets', path: ROUTES.CENTRE.SUPPORT, icon: MessageSquare },
  { label: 'Submission History', path: ROUTES.CENTRE.HISTORY, icon: History },
];

export default centreNav;
