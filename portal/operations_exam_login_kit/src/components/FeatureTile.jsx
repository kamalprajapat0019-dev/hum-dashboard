import React from "react";
import { ClipboardList, Building2, ShieldCheck, FileText, Database, ChartNoAxesColumnIncreasing } from "lucide-react";

const iconMap = {
  Projects: ClipboardList,
  Centres: Building2,
  Audits: ShieldCheck,
  Documents: FileText,
  Finance: Database,
  Reports: ChartNoAxesColumnIncreasing,
};

export default function FeatureTile({ label }) {
  const Icon = iconMap[label] || ClipboardList;
  return (
    <div className="feature-tile">
      <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
