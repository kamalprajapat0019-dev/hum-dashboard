import {
  LayoutDashboard, Calculator, FileBadge, Receipt, IndianRupee, BarChart3
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const financeNav = [
  { label: 'Finance Overview', path: ROUTES.FINANCE.DASHBOARD, icon: LayoutDashboard },
  { label: 'Cost Sheets', path: ROUTES.FINANCE.COST, icon: Calculator },
  { label: 'Agreements & MOU', path: ROUTES.FINANCE.AGREEMENTS, icon: FileBadge },
  { label: 'Invoice Management', path: ROUTES.FINANCE.INVOICES, icon: Receipt },
  { label: 'Payments', path: ROUTES.FINANCE.PAYMENTS, icon: IndianRupee },
  { label: 'Reconciliation', path: ROUTES.FINANCE.RECONCILE, icon: BarChart3 },
];

export default financeNav;
