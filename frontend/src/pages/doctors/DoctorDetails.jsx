import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Table from '../../components/Table';
import { useLanguage } from '../../context/LanguageContext';

const DoctorDetails = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    api.get(`/doctors/${id}`).then(({ data }) => setDoctor(data)).catch((err) => setError(err.response?.data?.message || t('common.loadingError')));
  }, [id]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!doctor) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{doctor.fullName}</h1>
          <p className="text-sm text-slate-500">{doctor.specialty} · {doctor.department}</p>
        </div>
        <Link to="/doctors"><Button variant="secondary"><ArrowLeft size={16} />{t('common.back')}</Button></Link>
      </div>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <p><span className="font-semibold">{t('common.phone')}:</span> {doctor.phone}</p>
        <p><span className="font-semibold">{t('common.email')}:</span> {doctor.email}</p>
        <p><span className="font-semibold">{t('forms.availability')}:</span> {doctor.availability}</p>
        <p><span className="font-semibold">{t('dashboard.patients')}:</span> {doctor.patients?.length || 0}</p>
      </section>
      <Table
        columns={[
          { key: 'fullName', label: t('dashboard.patients') },
          { key: 'phone', label: t('common.phone') },
          { key: 'gender', label: t('common.gender') }
        ]}
        data={doctor.patients || []}
        emptyMessage={t('profile.noPatients')}
      />
    </div>
  );
};

export default DoctorDetails;
