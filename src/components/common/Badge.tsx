import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-sm font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Active':
      return <Badge variant="success">Active</Badge>;
    case 'Regular':
      return <Badge variant="primary">Regular</Badge>;
    case 'On & Off':
      return <Badge variant="warning">On & Off</Badge>;
    case 'At Risk':
      return <Badge variant="warning">At Risk</Badge>;
    case 'Inactive':
      return <Badge variant="danger">Inactive</Badge>;
    case 'Suspended':
      return <Badge variant="danger">Suspended</Badge>;
    case 'Missing':
      return <Badge variant="neutral">Missing</Badge>;
    case 'Present':
      return <Badge variant="success">Present</Badge>;
    case 'Absent':
      return <Badge variant="danger">Absent</Badge>;
    case 'Excused':
      return <Badge variant="info">Excused</Badge>;
    case 'Late':
      return <Badge variant="warning">Late</Badge>;
    case 'Junior':
      return <Badge variant="purple">Junior</Badge>;
    case 'Senior':
      return <Badge variant="primary">Senior</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
