'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
      <Icon className="w-14 h-14 md:w-16 md:h-16 text-outline-variant/25 mb-5" />
      <h3 className="text-base md:text-lg font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant/50 text-sm max-w-xs mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
