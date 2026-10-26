import React from "react";
import { Crown, BriefcaseBusiness, ShieldCheck, Settings2, Database, Building2 } from "lucide-react";

const roleMap = {
  Admin: Crown,
  PM: BriefcaseBusiness,
  Auditor: ShieldCheck,
  Operations: Settings2,
  Finance: Database,
  Centre: Building2,
};

export default function RoleBadge({ role }) {
  const Icon = roleMap[role] || ShieldCheck;
  return (
    <div className={`role-badge role-badge--${role.toLowerCase()}`}>
      <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      <span>{role}</span>
    </div>
  );
}
