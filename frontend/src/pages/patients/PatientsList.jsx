import { useEffect, useState } from 'react';
import { CalendarDays, Eye, HeartPulse, Mail, Pencil, Phone, Plus, Trash2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';
import { toI18nKey } from '../../utils/i18nKeys';
import PatientForm from './PatientForm';

const initials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const ageFromDate = (date) => {
  if (!date) return '-';
  const dob = new Date(date);
  if (Number.isNaN(dob.getTime())) return '-';
  const diff = Date.now() - dob.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const patientStatus = (patient, index) => {
  const created = new Date(patient.createdAt);
  const days = Number.isNaN(created.getTime()) ? 999 : (Date.now() - created.getTime()) / 86400000;
  if (days < 14) return { label: 'Follow up', className: 'bg-amber-100 text-amber-700' };
  if (index % 3 === 0) return { label: 'Under Observation', className: 'bg-fuchsia-100 text-fuchsia-700' };
  if (index % 3 === 1) return { label: 'Recovered', className: 'bg-emerald-100 text-emerald-700' };
  return { label: 'Under Treatment', className: 'bg-sky-100 text-sky-700' };
};

const avatarColors = ['bg-sky-100 text-sky-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];

const PatientsList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, patient: null });
  const [confirm, setConfirm] = useState(null);
  const doctorLabel = (doctor) => {
    const specialty = doctor.specialty ? t(`specialties.${toI18nKey(doctor.specialty)}`, doctor.specialty) : '';
    return `${doctor.fullName}${specialty ? ` · ${specialty}` : ''}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get('/patients', { params: { search: search || undefined, assignedDoctor: assignedDoctor || undefined } }),
        permissions.canChangePatientDoctor(role) ? api.get('/doctors') : Promise.resolve({ data: [] })
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [search, assignedDoctor, role]);

  const savePatient = async (payload) => {
    setSaving(true);
    try {
      if (modal.patient) await api.put(`/patients/${modal.patient._id}`, payload);
      else await api.post('/patients', payload);
      setModal({ open: false, patient: null });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = async () => {
    setSaving(true);
    try {
      await api.delete(`/patients/${confirm._id}`);
      setConfirm(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToDelete'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="clinic-card p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{t('pages.patientsTitle')}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-400">{t('pages.patientsSubtitle')}</p>
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')} ${t('nav.patients')}`} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {permissions.canChangePatientDoctor(role) && (
              <Select
                value={assignedDoctor}
                onChange={(event) => setAssignedDoctor(event.target.value)}
                placeholder={t('patients.allAssignedDoctors')}
                className="sm:min-w-64"
                options={doctors.map((doctor) => ({ value: doctor._id, label: doctorLabel(doctor) }))}
              />
            )}
            {permissions.canCreatePatient(role) && (
              <Button onClick={() => setModal({ open: true, patient: null })} className="shrink-0">
                <Plus size={16} />
                {t('pages.newPatient')}
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <div className="rounded-[1.25rem] bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
      {!loading && (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[1.35rem] bg-primary-600 p-5 text-white shadow-panel">
            <p className="text-3xl font-black">{patients.length}</p>
            <p className="mt-1 text-sm font-semibold text-sky-100">{t('dashboard.patients')}</p>
          </div>
          <div className="clinic-card p-5">
            <p className="text-3xl font-black text-slate-950">{patients.filter((patient) => patient.gender === 'female').length}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{t('forms.female', 'Female')}</p>
          </div>
          <div className="clinic-card p-5">
            <p className="text-3xl font-black text-slate-950">{patients.filter((patient) => patient.gender === 'male').length}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{t('forms.male', 'Male')}</p>
          </div>
          <div className="clinic-card p-5">
            <p className="text-3xl font-black text-slate-950">{doctors.length || '-'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{t('nav.doctors')}</p>
          </div>
        </div>
      )}
      {loading ? <Loader /> : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {patients.map((patient, index) => {
            const status = patientStatus(patient, index);
            return (
              <article key={patient._id} className="clinic-card relative overflow-hidden p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-black shadow-sm ${avatarColors[index % avatarColors.length]}`}>
                    {initials(patient.fullName) || <UserRound size={22} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/patients/${patient._id}`} className="block truncate text-base font-black text-slate-950 hover:text-primary-700">
                      {patient.fullName}
                    </Link>
                    <p className="truncate text-sm font-semibold text-slate-500">{patient.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-primary-600">
                        <Phone size={13} /> {patient.phone}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-primary-600">
                        <Mail size={13} /> Email
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500">{t('common.gender')}, Age</span>
                    <span className="text-right font-bold text-slate-950">{t(`forms.${patient.gender}`, patient.gender)}, {ageFromDate(patient.dateOfBirth)}y</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500">{t('forms.assignedDoctor')}</span>
                    <span className="text-right font-bold text-slate-950">{patient.assignedDoctor?.fullName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500">{t('common.created')}</span>
                    <span className="inline-flex items-center gap-1 text-right font-bold text-slate-950">
                      <CalendarDays size={14} /> {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500">Status</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-sky-50 pt-4">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                    <HeartPulse size={15} /> Care record
                  </span>
                  <div className="flex justify-end gap-2">
                    <Link to={`/patients/${patient._id}`}><Button variant="secondary" className="h-9 w-9 px-0" aria-label={t('actions.view')}><Eye size={16} /></Button></Link>
                    {permissions.canEditPatient(role) && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, patient })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>}
                    {permissions.canDeletePatient(role) && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(patient)} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>}
                  </div>
                </div>
              </article>
            );
          })}
          {!patients.length && (
            <div className="clinic-card col-span-full p-10 text-center text-sm font-semibold text-slate-500">
              {t('common.noRecords')}
            </div>
          )}
        </div>
      )}
      <Modal open={modal.open} title={modal.patient ? t('pages.patientsTitle') : t('pages.newPatient')} onClose={() => setModal({ open: false, patient: null })}>
        <PatientForm
          initialData={modal.patient}
          doctors={permissions.canChangePatientDoctor(role) ? doctors : modal.patient?.assignedDoctor ? [modal.patient.assignedDoctor] : []}
          canChangeDoctor={permissions.canChangePatientDoctor(role)}
          onSubmit={savePatient}
          loading={saving}
          onCancel={() => setModal({ open: false, patient: null })}
        />
      </Modal>
      <ConfirmDialog open={!!confirm} message={`${t('common.delete')} ${confirm?.fullName}?`} onCancel={() => setConfirm(null)} onConfirm={deletePatient} loading={saving} />
    </div>
  );
};

export default PatientsList;
