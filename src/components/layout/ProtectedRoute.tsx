import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ProjectSectionPermissions } from '../../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredSection?: keyof ProjectSectionPermissions;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, requiredSection, adminOnly }: ProtectedRouteProps) {
  const { currentUserProfile, hasPermission } = useAppContext();

  if (adminOnly && currentUserProfile?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 max-w-sm">
          You do not have administrative privileges to access this page. Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  if (requiredSection && !hasPermission(requiredSection)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 max-w-sm">
          Your current role ({currentUserProfile?.role}) does not have permission to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
