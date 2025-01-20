import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';

const PrivateRoute = ({ children, allowedRoles = ['admin', 'regular', 'guest'] }) => {
  const { isAuthenticated, user, userRole, loading } = useSelector((state) => state.auth);
  const accessToken = Cookies.get('accessToken');

  // If loading, you might want to return a loading spinner or null
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // Check both Redux state and token existence
  if (!isAuthenticated || !accessToken) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default PrivateRoute; 