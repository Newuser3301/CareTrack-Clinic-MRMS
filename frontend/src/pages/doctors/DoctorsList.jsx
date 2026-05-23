import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Input from '../../components/Input';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Table from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../i18n/translations';
import { permissions } from '../../utils/permissions';
import { toI18nKey } from '../../utils/i18nKeys';
import DoctorForm from './DoctorForm';

const canonicalFilterValues = {
  specialties: {
    cardiology: 'Cardiology',
    orthopedics: 'Orthopedics',
    gastroenterology: 'Gastroenterology',
    general_practice: 'General Practice',
    pediatrics: 'Pediatrics',
    dermatology: 'Dermatology',
    nephrology: 'Nephrology',
    gynecology: 'Gynecology',
    neurology: 'Neurology',
    ophthalmology: 'Ophthalmology',
    pulmonology: 'Pulmonology',
    endocrinology: 'Endocrinology'
  }
};

const DoctorsList = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const role = user?.role;
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, doctor: null });
  const [confirm, setConfirm] = useState(null);

  const canonicalizeFilter = (dictionary, value) => {
    const input = (value || '').trim();
    if (!input) return undefined;
    if (language === 'en') return input;

    const langMap = translations?.[language]?.[dictionary];
    const rawMap = canonicalFilterValues[dictionary];
    if (!langMap || !rawMap) return input;

    const inputLower = input.toLowerCase();
    const candidates = Object.entries(langMap)
      .filter(([, label]) => String(label).toLowerCase().includes(inputLower))
      .map(([key]) => key);

    if (!candidates.length) return input;

    const exactKey = candidates.find((key) => String(langMap[key]).toLowerCase() === inputLower);
    const key = exactKey || candidates[0];
    return rawMap[key] || input;
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors', {
        params: {
          search: search || undefined,
          specialty: canonicalizeFilter('specialties', specialty),
          availability: availability || undefined
        }
      });
      setDoctors(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadDoctors, 250);
    return () => clearTimeout(timer);
  }, [search, specialty, availability]);

  const saveDoctor = async (payload) => {
    setSaving(true);
    try {
      if (modal.doctor) await api.put(`/doctors/${modal.doctor._id}`, payload);
      else await api.post('/doctors', payload);
      setModal({ open: false, doctor: null });
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const deleteDoctor = async () => {
    setSaving(true);
    try {
      await api.delete(`/doctors/${confirm._id}`);
      setConfirm(null);
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToDelete'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'fullName', label: t('doctors.table.doctor', 'Shifokor') },
    { key: 'specialty', label: t('forms.specialty'), render: (row) => t(`specialties.${toI18nKey(row.specialty)}`, row.specialty) },
    { key: 'phone', label: t('common.phone') },
    { key: 'availability', label: t('forms.availability') }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pages.doctorsTitle')}</h1>
          <p className="text-sm text-slate-500">{t('pages.doctorsSubtitle')}</p>
        </div>
        {permissions.canCreateDoctor(role) && <Button onClick={() => setModal({ open: true, doctor: null })}><Plus size={16} />{t('pages.newDoctor')}</Button>}
      </div>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')}...`} />
        </div>
        <Input label={t('forms.specialty')} value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder={t('placeholders.specialtyExample')} />
        <div>
          <Input label={t('forms.availability')} value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder={t('placeholders.availabilityExample')} />
        </div>
      </div>
      {loading ? <Loader /> : (
        <Table
          columns={[
            { ...columns[0], render: (row) => <Link to={`/doctors/${row._id}`} className="text-slate-950 hover:underline dark:text-white dark:hover:text-sky-100">{row.fullName}</Link> },
            ...columns.slice(1)
          ]}
          data={doctors}
          renderActions={(doctor) => (
            <div className="flex justify-end gap-2">
              <Link to={`/doctors/${doctor._id}`}><Button variant="secondary" className="h-9 w-9 px-0" aria-label={t('actions.view')}><Eye size={16} /></Button></Link>
              {permissions.canEditDoctor(role) && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, doctor })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>}
              {permissions.canDeleteDoctor(role) && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(doctor)} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>}
            </div>
          )}
        />
      )}
      <Modal open={modal.open} title={modal.doctor ? t('pages.doctorsTitle') : t('pages.newDoctor')} onClose={() => setModal({ open: false, doctor: null })}>
        <DoctorForm initialData={modal.doctor} onSubmit={saveDoctor} loading={saving} onCancel={() => setModal({ open: false, doctor: null })} />
      </Modal>
      <ConfirmDialog open={!!confirm} message={`${t('common.delete')} ${confirm?.fullName}?`} onCancel={() => setConfirm(null)} onConfirm={deleteDoctor} loading={saving} />
    </div>
  );
};

export default DoctorsList;
