import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Table from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';

const PatientProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/patients/${id}/profile`)
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.data?.message || t('common.loadingError')));
  }, [id]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!profile) return <Loader />;

  const { patient, diagnoses } = profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{patient.fullName}</h1>
          <p className="text-sm text-slate-500">{t('patients.profileSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          {permissions.canCreateDiagnosis(user?.role) && <Link to={`/diagnoses?patient=${patient._id}`}><Button><Plus size={16} />{t('patients.addDiagnosis')}</Button></Link>}
          <Link to="/patients"><Button variant="secondary"><ArrowLeft size={16} />{t('common.back')}</Button></Link>
        </div>
      </div>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <p><span className="font-semibold">{t('forms.dateOfBirth')}:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
        <p><span className="font-semibold">{t('common.gender')}:</span> {t(`forms.${patient.gender}`, patient.gender)}</p>
        <p><span className="font-semibold">{t('common.phone')}:</span> {patient.phone}</p>
        <p><span className="font-semibold">{t('forms.emergencyContact')}:</span> {patient.emergencyContact}</p>
        <p className="md:col-span-2"><span className="font-semibold">{t('common.address')}:</span> {patient.address}</p>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">{t('forms.assignedDoctor')}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <p>{patient.assignedDoctor?._id ? <Link to={`/doctors/${patient.assignedDoctor._id}`} className="text-primary-700 hover:underline">{patient.assignedDoctor.fullName}</Link> : '-'}</p>
          <p>{patient.assignedDoctor?.specialty}</p>
          <p>{patient.assignedDoctor?.department}</p>
        </div>
      </section>
      <Table
        columns={[
          { key: 'icdCode', label: 'ICD' },
          { key: 'description', label: t('common.description') },
          { key: 'severity', label: t('common.severity'), render: (row) => <Badge tone={row.severity}>{t(`severity.${row.severity}`, row.severity)}</Badge> },
          { key: 'diagnosedDate', label: t('common.date'), render: (row) => new Date(row.diagnosedDate).toLocaleDateString() }
        ]}
        data={diagnoses}
        emptyMessage={t('patients.noDiagnoses')}
      />
    </div>
  );
};

export default PatientProfile;
