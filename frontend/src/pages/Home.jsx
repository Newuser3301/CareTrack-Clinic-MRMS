import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Profile from './Profile';
import PatientProfile from './patients/PatientProfile';
import api from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    if (user?.role !== 'patient') return;

    setLoadingPatient(true);
    setError('');
    api
      .get('/patients')
      .then(({ data }) => {
        const nextPatientId = data?.[0]?._id;
        if (!nextPatientId) {
          setError(t('patients.profileMissing', 'Bemor profili topilmadi.'));
          return;
        }
        setPatientId(nextPatientId);
      })
      .catch((err) => setError(err.response?.data?.message || t('common.loadingError')))
      .finally(() => setLoadingPatient(false));
  }, [t, user?.role]);

  if (['super_admin', 'admin'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.role === 'patient') {
    if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
    if (loadingPatient || !patientId) return <Loader />;
    return <PatientProfile patientId={patientId} selfView />;
  }

  return <Profile />;
};

export default Home;
