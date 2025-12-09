import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactElement;
    requiredRole?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, loading, role } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <LoadingSpinner fullScreen text="Authenticating..." size="lg" />
        );
    }

    if (!user) {
        // Redirect to login with the return location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role requirements if specified
    if (requiredRole && role !== requiredRole) {
        // User is logged in but doesn't have the required role
        return (
            <Navigate
                to="/"
                state={{
                    error: 'You do not have permission to access this page.',
                    from: location
                }}
                replace
            />
        );
    }

    return children;
};

export default ProtectedRoute;
