import React from 'react';
import { RideStatus, DriverStatus } from '../types';

interface StatusBadgeProps {
  status: RideStatus | DriverStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'AVAILABLE':
    case 'COMPLETED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'REQUESTED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      break;
    case 'ACCEPTED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'IN_PROGRESS':
    case 'BUSY':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'CANCELLED':
    case 'OFFLINE':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {status.replace('_', ' ')}
    </span>
  );
};
