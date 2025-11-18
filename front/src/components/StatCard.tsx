import { ReactNode } from 'react';

interface StatCardProps {
  children: ReactNode;
  className?: string;
}

export function StatCard({ children, className = "" }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}
