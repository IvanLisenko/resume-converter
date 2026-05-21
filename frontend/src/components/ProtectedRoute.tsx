import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

export const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};