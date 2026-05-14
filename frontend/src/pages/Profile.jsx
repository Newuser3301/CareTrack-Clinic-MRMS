import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users
} from 'lucide-react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { permissions, roleLabel } from '../utils/permissions';

const Metric = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  </div>
);

const Pill = ({ label, value, tone = 'bg-primary-700' }) => (
  <div>
    <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
    <div className="h-9 overflow-hidden rounded-full bg-white/80">
      <div className={`flex h-full items-center rounded-full px-4 text-sm font-bold text-white ${tone}`} style={{ width: `${value}%` }}>
        {value}%
      </div>
    </div>
  </div>
);

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState({ stats: null, patients: [], diagnoses: [], doctors: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const requests = [
          api.get('/dashboard/stats'),
          permissions.canViewPatients(user?.role) ? api.get('/patients') : Promise.resolve({ data: [] }),
          permissions.canViewDiagnoses(user?.role) ? api.get('/diagnoses') : Promise.resolve({ data: [] }),
          permissions.canViewDoctors(user?.role) ? api.get('/doctors') : Promise.resolve({ data: [] })
        ];
        const [statsRes, patientsRes, diagnosesRes, doctorsRes] = await Promise.all(requests);
        setData({
          stats: statsRes.data,
          patients: patientsRes.data,
          diagnoses: diagnosesRes.data,
          doctors: doctorsRes.data
        });
      } catch (err) {
        setError(err.response?.data?.message || t('common.loadingError'));
      }
    };

    loadProfile();
  }, [user?.role]);

  const profileRecord = useMemo(() => {
    if (user?.role === 'patient') return data.patients[0];
    if (user?.role === 'doctor') return data.doctors[0];
    return null;
  }, [data.doctors, data.patients, user?.role]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data.stats) return <Loader />;

  const primaryPatients = data.patients.slice(0, 5);
  const primaryDiagnoses = data.diagnoses.slice(0, 5);
  const completion = data.stats.totalPatients ? Math.round((data.stats.diagnosedPatients / data.stats.totalPatients) * 100) : 0;
  const riskPercent = data.stats.totalDiagnoses ? Math.round((data.stats.severeDiagnoses / data.stats.totalDiagnoses) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl rounded-[2rem] bg-white/35 p-4 shadow-soft ring-1 ring-white/80 lg:p-6">
      <div className="rounded-[1.5rem] bg-gradient-to-br from-cyan-50 via-white/65 to-sky-100 p-4 lg:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Badge tone={user?.role}>{t(`roles.${user?.role}`, roleLabel(user?.role))}</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-normal text-slate-950">{t('profile.welcome')}, {user?.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              {t('profile.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-5 rounded-[1.5rem] bg-white/70 p-4 shadow-panel">
            <Metric label={t('dashboard.patients')} value={data.stats.totalPatients} icon={UserRound} />
            <Metric label={t('dashboard.diagnoses')} value={data.stats.totalDiagnoses} icon={ClipboardList} />
            <Metric label={t('dashboard.users')} value={data.stats.totalUsers} icon={Users} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_0.9fr]">
          <Pill label={t('profile.coverage')} value={completion} tone="bg-primary-700" />
          <Pill label={t('profile.monthlyActivity')} value={Math.min(100, data.stats.diagnosesThisMonth * 12)} tone="bg-cyan-600" />
          <Pill label={t('profile.riskAttention')} value={riskPercent} tone="bg-amber-500" />
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">{t('profile.systemHealth')}</p>
            <div className="flex h-9 items-center justify-center rounded-full bg-white text-sm font-bold text-green-700">
              <ShieldCheck size={16} className="mr-2" />
              {t('profile.protected')}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <section className="overflow-hidden rounded-[1.35rem] bg-white/80 shadow-panel">
            <div className="grid min-h-64 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col justify-end bg-gradient-to-br from-cyan-200 via-blue-200 to-slate-300 p-5">
                <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/80 text-4xl font-bold text-slate-900 shadow-sm">
                  {initials(user?.name)}
                </div>
                <p className="text-xl font-bold text-slate-950">{profileRecord?.fullName || user?.name}</p>
                <p className="text-sm font-medium text-slate-600">{user?.email}</p>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-950">{t('profile.accountProfile')}</h2>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Activity size={16} />
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <p><span className="font-semibold text-slate-500">{t('common.role')}:</span> {t(`roles.${user?.role}`, roleLabel(user?.role))}</p>
                  {profileRecord?.specialty && <p><span className="font-semibold text-slate-500">{t('profile.specialty')}:</span> {profileRecord.specialty}</p>}
                  {profileRecord?.department && <p><span className="font-semibold text-slate-500">{t('profile.department')}:</span> {profileRecord.department}</p>}
                  {profileRecord?.phone && <p><span className="font-semibold text-slate-500">{t('common.phone')}:</span> {profileRecord.phone}</p>}
                  {profileRecord?.assignedDoctor && (
                    <p><span className="font-semibold text-slate-500">{t('dashboard.doctors')}:</span> {profileRecord.assignedDoctor?.fullName}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.35rem] bg-white/80 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">{t('profile.progress')}</h2>
              <HeartPulse className="text-primary-600" size={20} />
            </div>
            <p className="mt-2 text-4xl font-bold text-slate-950">{data.stats.diagnosesThisMonth}</p>
            <p className="text-sm text-slate-500">{t('profile.diagnosesThisMonth')}</p>
            <div className="mt-6 flex h-32 items-end justify-between gap-2">
              {[35, 62, 48, 74, 58, 86, 40].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-full bg-primary-600" style={{ height: `${height}%` }} />
                  <span className="text-xs text-slate-400">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.35rem] bg-white/80 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">{t('profile.timeTracker')}</h2>
              <Clock3 className="text-cyan-600" size={20} />
            </div>
            <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-cyan-100 border-r-primary-600 border-t-primary-600">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-950">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs font-medium text-slate-500">{t('profile.session')}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.7fr]">
          <section className="rounded-[1.35rem] bg-white/80 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">{t('profile.assignedRecords')}</h2>
              <CalendarDays className="text-slate-500" size={20} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {primaryPatients.map((patient) => (
                <div key={patient._id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-950">{patient.fullName}</p>
                  <p className="mt-1 text-xs text-slate-500">{patient.assignedDoctor?.fullName || 'No doctor'}</p>
                </div>
              ))}
              {!primaryPatients.length && <p className="text-sm text-slate-500 md:col-span-5">{t('profile.noPatients')}</p>}
            </div>
          </section>

          <section className="rounded-[1.35rem] bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('profile.clinicalTasks')}</h2>
              <p className="text-3xl font-bold">{primaryDiagnoses.length}/{data.stats.totalDiagnoses || 0}</p>
            </div>
            <div className="mt-5 space-y-3">
              {primaryDiagnoses.map((diagnosis) => (
                <div key={diagnosis._id} className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Stethoscope size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{diagnosis.icdCode} · {diagnosis.patient?.fullName || 'Patient'}</p>
                    <p className="truncate text-xs text-slate-300">{diagnosis.description}</p>
                  </div>
                  <CheckCircle2 className="text-primary-500" size={18} />
                </div>
              ))}
              {!primaryDiagnoses.length && <p className="text-sm text-slate-300">{t('profile.noDiagnoses')}</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
