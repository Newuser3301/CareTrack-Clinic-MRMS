import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Plus, Stethoscope } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Loader from '../../components/Loader';
import Select from '../../components/Select';
import Table from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';
import { toI18nKey } from '../../utils/i18nKeys';

const initials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('');

const yearsBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  let years = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) years -= 1;
  return Math.max(years, 0);
};

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const withVars = (template, vars) => {
  if (!template) return template;
  return Object.entries(vars || {}).reduce((acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)), template);
};

const Stat = ({ label, value, suffix }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className="mt-1 flex items-baseline gap-1">
      <div className="text-lg font-semibold text-slate-900">{value ?? '-'}</div>
      {suffix && <div className="text-xs text-slate-500">{suffix}</div>}
    </div>
  </div>
);

const Card = ({ title, icon: Icon, subtitle, children, right }) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
);

const Sparkline = ({ values = [], stroke = '#0f766e' }) => {
  const filtered = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (filtered.length < 2) return <div className="h-10 w-full rounded bg-slate-50" />;

  const width = 220;
  const height = 40;
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const range = max - min || 1;

  const points = filtered.map((v, i) => {
    const x = (i / (filtered.length - 1)) * (width - 8) + 4;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const PatientProfile = ({ patientId, selfView = false }) => {
  const { id } = useParams();
  const activePatientId = patientId || id;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState({ date: '', time: '' });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const fetchProfile = () =>
    api.get(`/patients/${activePatientId}/profile`)
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.data?.message || t('common.loadingError')));

  useEffect(() => {
    if (!activePatientId) return;
    fetchProfile();
  }, [activePatientId]);

  const todayLocal = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();
  const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDay();
    return day === 0 || day === 6;
  };
  const canBookAppointment = ['super_admin', 'admin', 'receptionist', 'patient'].includes(user?.role);
  const assignedDoctorId = profile?.patient?.assignedDoctor?._id;

  useEffect(() => {
    const date = booking.date;
    if (error || !profile || !date || !assignedDoctorId) {
      setAvailableTimes([]);
      setTimesLoading(false);
      return;
    }

    setBookingError('');
    setBookingSuccess('');

    if (isWeekend(date)) {
      setAvailableTimes([]);
      setBookingError(t('appointments.weekendError', 'Weekend kunlari bron qilish mumkin emas'));
      return;
    }

    setTimesLoading(true);
    api.get(`/doctors/${assignedDoctorId}/available-times`, { params: { date } })
      .then(({ data }) => setAvailableTimes(data?.available_times || []))
      .catch((err) => {
        setAvailableTimes([]);
        setBookingError(err.response?.data?.message || t('common.loadingError'));
      })
      .finally(() => setTimesLoading(false));
  }, [booking.date, assignedDoctorId, error, profile, t]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!profile) return <Loader />;

  const { patient, diagnoses, clinical } = profile;
  const latest = clinical?.latestVitals;
  const trend = clinical?.trendSummary || [];
  const weightSeries = (clinical?.vitalsHistory || []).map((v) => v.weightKg);
  const lastVitalsAt = latest?.recordedAt ? formatDateTime(latest.recordedAt) : '-';
  const age = patient?.dateOfBirth ? yearsBetween(patient.dateOfBirth, new Date()) : null;

  const now = new Date();
  const diagnosesLast730 = (diagnoses || []).filter((d) => {
    const dt = new Date(d.diagnosedDate);
    if (Number.isNaN(dt.getTime())) return false;
    const days = Math.floor((now.getTime() - dt.getTime()) / (24 * 60 * 60 * 1000));
    return days >= 0 && days <= 730;
  }).length;

  const submitAppointment = async (event) => {
    event.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!canBookAppointment) return;
    if (!assignedDoctorId) {
      setBookingError(t('appointments.noDoctor', 'Shifokor biriktirilmagan'));
      return;
    }
    if (!booking.date) {
      setBookingError(t('appointments.selectDate', 'Sanani tanlang'));
      return;
    }
    if (booking.date < todayLocal) {
      setBookingError(t('appointments.pastDateError', "O‘tib ketgan sanaga bron qilish mumkin emas"));
      return;
    }
    if (isWeekend(booking.date)) {
      setBookingError(t('appointments.weekendError', 'Weekend kunlari bron qilish mumkin emas'));
      return;
    }
    if (!booking.time) {
      setBookingError(t('appointments.selectTime', 'Vaqtni tanlang'));
      return;
    }

    setBookingSaving(true);
    try {
      await api.post('/appointments', {
        doctor_id: assignedDoctorId,
        patient_id: patient._id,
        date: booking.date,
        time: booking.time
      });
      setBookingSuccess(t('appointments.booked', 'Bron qilindi'));
      setBooking({ date: booking.date, time: '' });
      await fetchProfile();
      const { data } = await api.get(`/doctors/${assignedDoctorId}/available-times`, { params: { date: booking.date } });
      setAvailableTimes(data?.available_times || []);
    } catch (err) {
      setBookingError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setBookingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-sm font-semibold text-white shadow-sm">
            {initials(patient.fullName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{patient.fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {t(`forms.${patient.gender}`, patient.gender)}{typeof age === 'number' ? ` • ${age}y` : ''}
              </span>
              <span className="text-xs text-slate-500">{t('patients.profileSubtitle')}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.canCreateDiagnosis(user?.role) && (
            <Link to={`/diagnoses?patient=${patient._id}`}>
              <Button><Plus size={16} />{t('patients.addDiagnosis')}</Button>
            </Link>
          )}
          <Link to={`/patients/${patient._id}/report`}>
            <Button variant="secondary"><FileText size={16} />{t('reports.diagnosis', 'Tashxis hisoboti')}</Button>
          </Link>
          {!selfView && <Link to="/patients"><Button variant="secondary"><ArrowLeft size={16} />{t('common.back')}</Button></Link>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card
            title={t('patients.sections.vitals')}
            icon={Stethoscope}
            subtitle={`${t('patients.labels.lastVitals')}: ${lastVitalsAt}`}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t('patients.labels.heightCm')} value={latest?.heightCm} suffix="cm" />
              <Stat label={t('patients.labels.weightKg')} value={latest?.weightKg} suffix="kg" />
              <Stat label={t('patients.labels.calculatedBmi')} value={latest?.bmi} />
              <Stat label={t('patients.labels.temperatureC')} value={latest?.temperatureC} suffix="°C" />
              <Stat label={t('patients.labels.pulse')} value={latest?.pulse} suffix="/min" />
              <Stat label={t('patients.labels.respiratoryRate')} value={latest?.respiratoryRate} suffix="/min" />
              <Stat
                label={t('patients.labels.bloodPressure')}
                value={latest?.bloodPressure ? `${latest.bloodPressure.systolic} / ${latest.bloodPressure.diastolic}` : '-'}
                suffix="mmHg"
              />
              <Stat label={t('patients.labels.spo2')} value={latest?.spo2} suffix="%" />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">{t('patients.sections.weightGraph')}</div>
                  <div className="mt-0.5 text-xs text-slate-500">Last {clinical?.vitalsHistory?.length || 0} days</div>
                </div>
                <div className="w-56">
                  <Sparkline values={weightSeries} />
                </div>
              </div>
            </div>
          </Card>

          <Card
            title={t('patients.sections.healthTrend')}
            icon={Calendar}
            subtitle={trend.length ? `${trend.length} points` : withVars(t('patients.labels.noneLastDays'), { days: 7 })}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4 text-left">{t('common.date')}</th>
                    <th className="py-2 pr-4 text-left">HR</th>
                    <th className="py-2 pr-4 text-left">Temp (°C)</th>
                    <th className="py-2 pr-4 text-left">WT</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((row) => (
                    <tr key={row.date} className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-700">{formatDate(row.date)}</td>
                      <td className="py-2 pr-4 text-slate-700">{row.hr}</td>
                      <td className="py-2 pr-4 text-slate-700">{row.tempC}</td>
                      <td className="py-2 pr-4 text-slate-700">{row.weightKg}</td>
                    </tr>
                  ))}
                  {!trend.length && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">{t('common.noRecords')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title={t('patients.sections.diagnoses')}
            icon={FileText}
            subtitle={withVars(t('patients.labels.noneLastDays'), { days: 730 })}
            right={(
              <div className="text-xs font-medium text-slate-600">
                {diagnosesLast730} / {(diagnoses || []).length}
              </div>
            )}
          >
            <Table
              columns={[
                { key: 'icdCode', label: 'ICD' },
                { key: 'description', label: t('common.description') },
                { key: 'severity', label: t('common.severity'), render: (row) => <Badge tone={row.severity}>{t(`severity.${row.severity}`, row.severity)}</Badge> },
                { key: 'diagnosedDate', label: t('common.date'), render: (row) => formatDate(row.diagnosedDate) }
              ]}
              data={diagnoses}
              emptyMessage={t('patients.noDiagnoses')}
            />
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title={t('patients.sections.appointments')} icon={Calendar}>
              <div className="space-y-3">
                {canBookAppointment && assignedDoctorId && (
                  <form onSubmit={submitAppointment} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label={t('appointments.date', 'Sana')}
                        type="date"
                        min={todayLocal}
                        value={booking.date}
                        onChange={(e) => setBooking({ date: e.target.value, time: '' })}
                      />
                      <Select
                        label={t('appointments.time', 'Vaqt')}
                        value={booking.time}
                        onChange={(e) => setBooking((prev) => ({ ...prev, time: e.target.value }))}
                        placeholder={timesLoading ? t('appointments.loadingTimes', 'Vaqtlar yuklanmoqda...') : t('appointments.selectTime', 'Vaqtni tanlang')}
                        disabled={!booking.date || timesLoading || isWeekend(booking.date) || !availableTimes.length}
                        options={availableTimes.map((time) => ({ value: time, label: time }))}
                      />
                    </div>
                    {bookingError && <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{bookingError}</div>}
                    {bookingSuccess && <div className="mt-3 rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">{bookingSuccess}</div>}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Button type="submit" disabled={bookingSaving || timesLoading || !booking.date || !booking.time}>
                        {bookingSaving ? t('appointments.booking', 'Bron qilinmoqda...') : t('appointments.book', 'Bron qilish')}
                      </Button>
                      <div className="text-xs text-slate-500">
                        {!timesLoading && booking.date && !isWeekend(booking.date) && !availableTimes.length
                          ? t('appointments.noSlots', 'Bo‘sh vaqt topilmadi')
                          : ''}
                      </div>
                    </div>
                  </form>
                )}
                {(clinical?.appointments || []).map((appt) => (
                  <div key={appt.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{appt.type}</div>
                      <Badge tone={appt.status === 'cancelled' ? 'high' : 'low'}>
                        {appt.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{formatDateTime(appt.scheduledAt)} • {appt.location}</div>
                  </div>
                ))}
                {!(clinical?.appointments || []).length && <div className="text-sm text-slate-500">{t('common.noRecords')}</div>}
              </div>
            </Card>

            <Card title={t('patients.sections.recentVisits')} icon={Stethoscope}>
              <div className="space-y-3">
                {(clinical?.visits || []).slice(0, 6).map((v) => (
                  <div key={v.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{v.type}</div>
                        <div className="mt-0.5 text-xs text-slate-600">{v.note}</div>
                      </div>
                      <div className="text-xs text-slate-500">{formatDateTime(v.occurredAt)}</div>
                    </div>
                  </div>
                ))}
                {!(clinical?.visits || []).length && <div className="text-sm text-slate-500">{t('common.noRecords')}</div>}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card title={t('patients.patientInfo')} icon={Stethoscope}>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{t('forms.dateOfBirth')}</span>
                <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{t('common.phone')}</span>
                <span className="font-medium">{patient.phone || '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{t('forms.emergencyContact')}</span>
                <span className="font-medium">{patient.emergencyContact || '-'}</span>
              </div>
              <div className="pt-2 text-xs text-slate-500">{t('common.address')}</div>
              <div className="text-sm font-medium text-slate-700">{patient.address || '-'}</div>
            </div>
          </Card>

          <Card title={t('forms.assignedDoctor')} icon={Stethoscope}>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="font-medium">
                {patient.assignedDoctor?._id ? (
                  <Link to={`/doctors/${patient.assignedDoctor._id}`} className="text-primary-700 hover:underline">
                    {patient.assignedDoctor.fullName}
                  </Link>
                ) : '-'}
              </div>
              <div className="text-xs text-slate-500">
                {patient.assignedDoctor?.specialty ? t(`specialties.${toI18nKey(patient.assignedDoctor.specialty)}`, patient.assignedDoctor.specialty) : '-'}
                {' • '}
                {patient.assignedDoctor?.department ? t(`departments.${toI18nKey(patient.assignedDoctor.department)}`, patient.assignedDoctor.department) : '-'}
              </div>
            </div>
          </Card>

          <Card title={t('patients.sections.conditions')} icon={Stethoscope}>
            <div className="flex flex-wrap gap-2">
              {(clinical?.conditions || []).map((c) => (
                <span key={c.id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {c.icdCode ? `${c.icdCode} • ` : ''}{c.label}
                </span>
              ))}
              {!(clinical?.conditions || []).length && <div className="text-sm text-slate-500">{t('common.noRecords')}</div>}
            </div>
          </Card>

          <Card title={t('patients.sections.allergies')} icon={Stethoscope}>
            <div className="space-y-3">
              {(clinical?.allergies || []).map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{a.substance}</div>
                    <Badge tone={a.severity === 'high' ? 'high' : 'medium'}>{a.severity}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{(a.reactions || []).join(' , ')}</div>
                  <div className="mt-1 text-xs text-slate-500">{formatDate(a.notedAt)}</div>
                </div>
              ))}
              {!(clinical?.allergies || []).length && <div className="text-sm text-slate-500">{t('common.noRecords')}</div>}
            </div>
          </Card>

          <Card title={t('patients.sections.family')} icon={Stethoscope}>
            <div className="space-y-3 text-sm">
              {(clinical?.familyHistory || []).map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="font-semibold text-slate-900">{f.relation}</div>
                  <div className="mt-0.5 text-xs text-slate-600">{f.condition}{f.onsetAge ? ` • onset ~${f.onsetAge}y` : ''}</div>
                </div>
              ))}
              {!(clinical?.familyHistory || []).length && <div className="text-sm text-slate-500">{t('common.noRecords')}</div>}
            </div>
          </Card>

          <Card title={t('patients.sections.attachments')} icon={FileText}>
            <div className="space-y-2 text-sm">
              {(clinical?.attachments || []).map((att) => (
                <div key={att.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{att.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{att.type} • {att.sizeKb}KB • {formatDate(att.uploadedAt)}</div>
                  </div>
                  <div className="text-slate-400">
                    <FileText size={16} />
                  </div>
                </div>
              ))}
              {!(clinical?.attachments || []).length && <div className="text-sm text-slate-500">{t('common.noRecords')}</div>}
            </div>
          </Card>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar size={14} />
              <span>{t('patients.sections.latestObservations')}</span>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              {latest ? (
                <>
                  {t('patients.labels.weightKg')}: <span className="font-semibold">{latest.weightKg}</span> •{' '}
                  {t('patients.labels.heightCm')}: <span className="font-semibold">{latest.heightCm}</span> •{' '}
                  {t('patients.labels.temperatureC')}: <span className="font-semibold">{latest.temperatureC}</span>
                </>
              ) : (
                t('common.noRecords')
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
