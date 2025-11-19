import React from 'react';

interface MetricBadgeProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({ label, value, subValue, icon, color = "bg-slate-800" }) => {
  return (
    <div className={`${color} bg-opacity-50 border border-slate-700 rounded-xl p-4 flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};