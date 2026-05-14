import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { useLanguage } from '../../context/LanguageContext';
import { roleLabel } from '../../utils/permissions';

const Info = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p>
  </div>
);

const UserDetails = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/users/${id}`).then(({ data: payload }) => setData(payload)).catch((err) => setError(err.response?.data?.message || t('common.loadingError')));
  }, [id, t]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data) return <Loader />;

  const { user, profile } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Badge tone={user.role}>{t(`roles.${user.role}`, roleLabel(user.role))}</Badge>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <Link to="/users"><Button variant="secondary"><ArrowLeft size={16} />{t('common.back')}</Button></Link>
      </div>

      <section className="grid gap-4 rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel md:grid-cols-2 xl:grid-cols-4">
        <Info label={t('common.role')} value={t(`roles.${user.role}`, roleLabel(user.role))} />
        <Info label={t('common.email')} value={user.email} />
        <Info label={t('common.created')} value={new Date(user.createdAt).toLocaleDateString()} />
        <Info label="ID" value={user._id} />
      </section>

      {profile && (
        <section className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel">
          <div className="flex items-center gap-2">
            {user.role === 'doctor' ? <Stethoscope size={18} className="text-primary-700" /> : <UserRound size={18} className="text-primary-700" />}
            <h2 className="text-lg font-bold text-slate-900">{t('nav.profile')}</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {'fullName' in profile && <Info label={t('forms.fullName')} value={profile.fullName} />}
            {'phone' in profile && <Info label={t('common.phone')} value={profile.phone} />}
            {'specialty' in profile && <Info label={t('forms.specialty')} value={profile.specialty} />}
            {'department' in profile && <Info label={t('forms.department')} value={profile.department} />}
            {'availability' in profile && <Info label={t('forms.availability')} value={profile.availability} />}
            {'dateOfBirth' in profile && <Info label={t('forms.dateOfBirth')} value={new Date(profile.dateOfBirth).toLocaleDateString()} />}
            {'gender' in profile && <Info label={t('common.gender')} value={profile.gender} />}
            {'address' in profile && <Info label={t('common.address')} value={profile.address} />}
            {'emergencyContact' in profile && <Info label={t('forms.emergencyContact')} value={profile.emergencyContact} />}
            {profile.assignedDoctor?.fullName && <Info label={t('profile.primaryDoctor')} value={`${profile.assignedDoctor.fullName} · ${profile.assignedDoctor.specialty || ''}`} />}
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary-700" />
          <h2 className="text-lg font-bold text-slate-900">{t('forms.passwordAdminAccess')}</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">{t('forms.passwordAdminAccessHelp')}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <Mail size={16} />
          {t('forms.passwordHiddenNotice')}
        </p>
      </section>
    </div>
  );
};

export default UserDetails;
