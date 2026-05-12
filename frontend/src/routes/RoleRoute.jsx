import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole } from '../utils/permissions';

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  return user && hasAnyRole(user.role, allowedRoles) ? <Outlet /> : <Navigate to="/" replace />;
};

export default RoleRoute;
