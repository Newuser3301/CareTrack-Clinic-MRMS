import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  MapPin,
  Phone,
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

const StatCard = ({ label, value, helper, icon: Icon, tone }) => (
  <div className="rounded-[1.35rem] border border-white/70 bg-white/80 p-5 shadow-panel">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{value}</p>
        {helper && <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
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

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

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
          user?.role === 'patient' || permissions.canViewPatients(user?.role) ? api.get('/patients') : Promise.resolve({ data: [] }),
          user?.role === 'patient' || permissions.canViewDiagnoses(user?.role) ? api.get('/diagnoses') : Promise.resolve({ data: [] }),
          user?.role === 'doctor' || permissions.canViewDoctors(user?.role) ? api.get('/doctors') : Promise.resolve({ data: [] })
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
  }, [t, user?.role]);

  const patientRecord = user?.role === 'patient' ? data.patients[0] : null;
  const doctorRecord = user?.role === 'doctor' ? data.doctors[0] : null;
  const visiblePatients = useMemo(
    () => (user?.role === 'patient' ? data.patients.filter(Boolean) : data.patients.slice(0, 8)),
    [data.patients, user?.role]
  );
  const recentDiagnoses = data.diagnoses.slice(0, 8);
  const riskDiagnoses = data.diagnoses.filter((diagnosis) => ['high', 'critical'].includes(diagnosis.severity)).slice(0, 5);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data.stats) return <Loader />;

  const profileTitle = patientRecord?.fullName || doctorRecord?.fullName || user?.name;
  const summaryStats = user?.role === 'patient'
    ? [
        { label: t('dashboard.diagnoses'), value: data.stats.totalDiagnoses, helper: t('profile.careSummary'), icon: ClipboardList, tone: 'bg-cyan-50 text-cyan-700' },
        { label: t('profile.primaryDoctor'), value: data.stats.totalDoctors, helper: t('dashboard.activeProviders'), icon: Stethoscope, tone: 'bg-blue-50 text-blue-700' },
        { label: t('profile.riskCases'), value: data.stats.severeDiagnoses, helper: t('profile.priorityWatch'), icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
        { label: t('dashboard.monthlyDiagnoses'), value: data.stats.diagnosesThisMonth, helper: t('dashboard.diagnosedThisMonth'), icon: HeartPulse, tone: 'bg-rose-50 text-rose-700' }
      ]
    : [
        { label: t('dashboard.patients'), value: data.stats.totalPatients, helper: t('profile.patientRoster'), icon: UserRound, tone: 'bg-green-50 text-green-700' },
        { label: t('dashboard.diagnoses'), value: data.stats.totalDiagnoses, helper: t('profile.careSummary'), icon: ClipboardList, tone: 'bg-cyan-50 text-cyan-700' },
        { label: t('profile.riskCases'), value: data.stats.severeDiagnoses, helper: t('profile.priorityWatch'), icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
        permissions.canManageUsers(user?.role)
          ? { label: t('dashboard.users'), value: data.stats.totalUsers, helper: t('dashboard.systemAccounts'), icon: Users, tone: 'bg-slate-100 text-slate-700' }
          : null
      ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-cyan-500 to-primary-700 text-2xl font-black text-white shadow-panel">
              {initials(profileTitle)}
            </div>
            <div>
              <Badge tone={user?.role}>{t(`roles.${user?.role}`, roleLabel(user?.role))}</Badge>
              <h1 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">{profileTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{t('profile.subtitle')}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={Activity} label={t('common.role')} value={t(`roles.${user?.role}`, roleLabel(user?.role))} />
            <InfoRow icon={Phone} label={t('common.email')} value={user?.email} />
            {(doctorRecord?.phone || patientRecord?.phone) && <InfoRow icon={Phone} label={t('common.phone')} value={doctorRecord?.phone || patientRecord?.phone} />}
            {doctorRecord?.department && <InfoRow icon={ShieldCheck} label={t('profile.department')} value={doctorRecord.department} />}
            {doctorRecord?.availability && <InfoRow icon={CalendarDays} label={t('forms.availability')} value={doctorRecord.availability} />}
            {patientRecord?.assignedDoctor?.fullName && <InfoRow icon={Stethoscope} label={t('profile.primaryDoctor')} value={patientRecord.assignedDoctor.fullName} />}
            {patientRecord?.address && <InfoRow icon={MapPin} label={t('common.address')} value={patientRecord.address} />}
            {patientRecord?.emergencyContact && <InfoRow icon={Users} label={t('forms.emergencyContact')} value={patientRecord.emergencyContact} />}
          </div>
        </div>
      </section>

      <section className={`grid gap-4 md:grid-cols-2 ${summaryStats.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        {summaryStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{t('profile.recentDiagnoses')}</h2>
              <p className="text-sm text-slate-500">{t('profile.careSummary')}</p>
            </div>
            <ClipboardList className="text-cyan-700" size={20} />
          </div>
          <div className="mt-5 space-y-3">
            {recentDiagnoses.map((diagnosis) => (
              <div key={diagnosis._id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{diagnosis.icdCode} · {diagnosis.description}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {diagnosis.patient?.fullName || profileTitle} · {formatDate(diagnosis.diagnosedDate)}
                    </p>
                  </div>
                  <Badge tone={diagnosis.severity}>{diagnosis.severity}</Badge>
                </div>
                {diagnosis.notes && <p className="mt-3 text-sm text-slate-600">{diagnosis.notes}</p>}
              </div>
            ))}
            {!recentDiagnoses.length && <p className="text-sm text-slate-500">{t('profile.noDiagnoses')}</p>}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{t('profile.patientRoster')}</h2>
              <p className="text-sm text-slate-500">{t('profile.assignedRecords')}</p>
            </div>
            <UserRound className="text-green-700" size={20} />
          </div>
          <div className="mt-5 space-y-3">
            {visiblePatients.map((patient) => (
              <div key={patient._id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{patient.fullName}</p>
                  <p className="text-xs font-semibold uppercase text-slate-400">{patient.gender}</p>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <span>{t('common.phone')}: {patient.phone}</span>
                  <span>{t('common.date')}: {formatDate(patient.dateOfBirth)}</span>
                  {patient.assignedDoctor?.fullName && <span>{t('profile.primaryDoctor')}: {patient.assignedDoctor.fullName}</span>}
                  {patient.emergencyContact && <span>{t('forms.emergencyContact')}: {patient.emergencyContact}</span>}
                </div>
              </div>
            ))}
            {!visiblePatients.length && <p className="text-sm text-slate-500">{t('profile.noPatients')}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{t('profile.priorityWatch')}</h2>
              <p className="text-sm text-slate-500">{t('profile.riskCases')}</p>
            </div>
            <AlertTriangle className="text-amber-600" size={20} />
          </div>
          <div className="mt-5 space-y-3">
            {riskDiagnoses.map((diagnosis) => (
              <div key={diagnosis._id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{diagnosis.patient?.fullName || profileTitle}</p>
                  <Badge tone={diagnosis.severity}>{diagnosis.severity}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{diagnosis.icdCode} · {diagnosis.description}</p>
              </div>
            ))}
            {!riskDiagnoses.length && <p className="text-sm text-slate-500">{t('dashboard.noRisk')}</p>}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{t('profile.systemHealth')}</h2>
              <p className="text-sm text-slate-500">{t('profile.careSummary')}</p>
            </div>
            <ShieldCheck className="text-green-600" size={20} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoRow icon={HeartPulse} label={t('dashboard.monthlyDiagnoses')} value={`${data.stats.diagnosesThisMonth}`} />
            <InfoRow icon={CalendarDays} label={t('dashboard.todayDiagnoses')} value={`${data.stats.diagnosesToday}`} />
            <InfoRow icon={AlertTriangle} label={t('dashboard.highCritical')} value={`${data.stats.severeDiagnoses}`} />
            <InfoRow icon={ShieldCheck} label={t('dashboard.diagnosisCoverage')} value={`${data.stats.diagnosedPatients}/${data.stats.totalPatients}`} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
