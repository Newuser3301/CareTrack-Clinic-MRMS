import { Navigate } from 'react-router-dom';
import Profile from './Profile';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  if (['super_admin', 'admin'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Profile />;
};

export default Home;
