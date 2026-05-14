import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole } from '../utils/permissions';

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return hasAnyRole(user.role, allowedRoles) ? <Outlet /> : <Navigate to={user.role === 'patient' ? '/' : '/forbidden'} replace />;
};

export default RoleRoute;
