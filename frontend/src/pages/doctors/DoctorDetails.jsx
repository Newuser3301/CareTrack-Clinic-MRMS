import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseMedical,
  CalendarDays,
  Clock,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users
} from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';
import { toI18nKey } from '../../utils/i18nKeys';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const yearsFrom = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const years = Math.max(0, new Date().getFullYear() - date.getFullYear());
  return years;
};

const ageFromDate = (value) => {
  if (!value) return '-';
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return '-';
  let age = new Date().getFullYear() - dob.getFullYear();
  const month = new Date().getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && new Date().getDate() < dob.getDate())) age -= 1;
  return Math.max(age, 0);
};

const patientStatus = (patient, index) => {
  const created = new Date(patient.createdAt);
  const days = Number.isNaN(created.getTime()) ? 999 : (Date.now() - created.getTime()) / 86400000;
  if (days < 14) return { label: 'New', className: 'bg-amber-100 text-amber-700' };
  if (index % 3 === 0) return { label: 'Under Observation', className: 'bg-fuchsia-100 text-fuchsia-700' };
  if (index % 3 === 1) return { label: 'Recovered', className: 'bg-emerald-100 text-emerald-700' };
  return { label: 'Under Treatment', className: 'bg-sky-100 text-sky-700' };
};

const avatarColors = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700'
];

const StatCard = ({ label, value, helper, icon: Icon, tone = 'bg-sky-50 text-primary-700' }) => (
  <div className="clinic-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-extrabold text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
        {helper && <p className="mt-1 text-sm font-bold text-slate-400">{helper}</p>}
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] ${tone}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between gap-4 rounded-[1rem] bg-sky-50/75 px-4 py-3">
    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
      {Icon && <Icon size={16} />}
      {label}
    </span>
    <span className="text-right text-sm font-black text-slate-950">{value || '-'}</span>
  </div>
);

const PatientCard = ({ patient, index, t }) => {
  const status = patientStatus(patient, index);

  return (
    <article className="clinic-card p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-black shadow-sm ${avatarColors[index % avatarColors.length]}`}>
          {initials(patient.fullName) || <UserRound size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/patients/${patient._id}`} className="block truncate text-base font-black text-slate-950 hover:text-primary-700">
            {patient.fullName}
          </Link>
          <p className="truncate text-sm font-semibold text-slate-500">{patient.email || patient.phone}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {patient.phone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-primary-600">
                <Phone size={13} /> {patient.phone}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-500">{t('common.gender')}, Age</span>
          <span className="text-right font-bold text-slate-950">
            {t(`forms.${patient.gender}`, patient.gender)}, {ageFromDate(patient.dateOfBirth)}y
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-500">{t('common.created')}</span>
          <span className="inline-flex items-center gap-1 text-right font-bold text-slate-950">
            <CalendarDays size={14} /> {formatDate(patient.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-500">{t('common.address')}</span>
          <span className="max-w-[14rem] truncate text-right font-bold text-slate-950">{patient.address || '-'}</span>
        </div>
      </div>
    </article>
  );
};

const DoctorDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/doctors/${id}`)
      .then(({ data }) => setDoctor(data))
      .catch((err) => setError(err.response?.data?.message || t('common.loadingError')));
  }, [id, t]);

  const patients = doctor?.patients || [];
  const specialty = doctor ? t(`specialties.${toI18nKey(doctor.specialty)}`, doctor.specialty) : '';
  const patientBreakdown = useMemo(() => {
    const counts = patients.reduce(
      (acc, patient) => {
        acc.total += 1;
        if (patient.gender === 'female') acc.female += 1;
        if (patient.gender === 'male') acc.male += 1;
        return acc;
      },
      { total: 0, female: 0, male: 0 }
    );
    return counts;
  }, [patients]);

  if (error) return <div className="rounded-[1.25rem] bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>;
  if (!doctor) return <Loader />;

  return (
    <div className="space-y-5">
      <section className="clinic-card overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-sky-100 bg-primary-600 text-2xl font-black text-white shadow-panel">
              {initials(doctor.fullName) || <Stethoscope size={34} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase text-primary-600">CareTrack Provider</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{doctor.fullName}</h1>
              <p className="mt-2 text-base font-bold text-slate-500">{specialty}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                  <ShieldCheck size={15} /> Active
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-primary-700">
                  <Users size={15} /> {patients.length} {t('dashboard.patients')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">
                  <BriefcaseMedical size={15} /> {t(`roles.${doctor.user?.role}`, doctor.user?.role || 'doctor')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] bg-sky-50/75 p-4">
            <div className="grid gap-3">
              <InfoRow label={t('common.phone')} value={doctor.phone} icon={Phone} />
              <InfoRow label={t('common.email')} value={doctor.email} icon={Mail} />
              <InfoRow label={t('forms.availability')} value={doctor.availability} icon={Clock} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {permissions.canEditDoctor(user?.role) && (
                <Link to="/doctors">
                  <Button variant="secondary">
                    <Pencil size={16} />
                    {t('actions.edit')}
                  </Button>
                </Link>
              )}
              <Link to="/doctors">
                <Button variant="secondary">
                  <ArrowLeft size={16} />
                  {t('common.back')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.patients')} value={patientBreakdown.total} helper="Assigned care records" icon={Users} tone="bg-sky-50 text-primary-700" />
        <StatCard label={t('forms.female', 'Female')} value={patientBreakdown.female} helper="Patient roster" icon={UserRound} tone="bg-rose-50 text-rose-700" />
        <StatCard label={t('forms.male', 'Male')} value={patientBreakdown.male} helper="Patient roster" icon={UserRound} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label={t('common.created')} value={yearsFrom(doctor.createdAt)} helper={`Since ${formatDate(doctor.createdAt)}`} icon={CalendarDays} tone="bg-violet-50 text-violet-700" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="clinic-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Professional Profile</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t('forms.specialty')} · {t('common.role')}</p>
            </div>
            <Stethoscope className="text-primary-600" size={24} />
          </div>
          <div className="mt-5 space-y-3">
            <InfoRow label={t('forms.specialty')} value={specialty} icon={BriefcaseMedical} />
            <InfoRow label={t('common.email')} value={doctor.user?.email || doctor.email} icon={Mail} />
            <InfoRow label={t('common.role')} value={t(`roles.${doctor.user?.role}`, doctor.user?.role || 'doctor')} icon={UserRound} />
          </div>
        </section>

        <section className="clinic-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">{t('dashboard.patients')}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Assigned patients and current care roster.</p>
            </div>
            <Users className="text-primary-600" size={24} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.1rem] bg-primary-600 p-4 text-white">
              <p className="text-2xl font-black">{patientBreakdown.total}</p>
              <p className="mt-1 text-xs font-bold text-sky-100">Total</p>
            </div>
            <div className="rounded-[1.1rem] bg-sky-50 p-4">
              <p className="text-2xl font-black text-slate-950">{patientBreakdown.female}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{t('forms.female', 'Female')}</p>
            </div>
            <div className="rounded-[1.1rem] bg-sky-50 p-4">
              <p className="text-2xl font-black text-slate-950">{patientBreakdown.male}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{t('forms.male', 'Male')}</p>
            </div>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t('profile.patientRoster')}</h2>
            <p className="text-sm font-semibold text-slate-500">{doctor.fullName} uchun biriktirilgan bemorlar.</p>
          </div>
        </div>
        {patients.length ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {patients.map((patient, index) => (
              <PatientCard key={patient._id} patient={patient} index={index} t={t} />
            ))}
          </div>
        ) : (
          <div className="clinic-card p-10 text-center text-sm font-semibold text-slate-500">
            {t('profile.noPatients')}
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorDetails;
