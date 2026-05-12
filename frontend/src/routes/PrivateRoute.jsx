import { Navigate, Outlet } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
