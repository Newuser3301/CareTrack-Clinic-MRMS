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
import { permissions } from '../../utils/permissions';
import DoctorForm from './DoctorForm';

const DoctorsList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [department, setDepartment] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, doctor: null });
  const [confirm, setConfirm] = useState(null);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors', {
        params: {
          search: search || undefined,
          specialty: specialty || undefined,
          department: department || undefined,
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
  }, [search, specialty, department, availability]);

  const saveDoctor = async (payload) => {
    setSaving(true);
    try {
      if (modal.doctor) await api.put(`/doctors/${modal.doctor._id}`, payload);
      else await api.post('/doctors', payload);
      setModal({ open: false, doctor: null });
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save doctor.');
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
      setError(err.response?.data?.message || 'Unable to delete doctor.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'department', label: 'Department' },
    { key: 'phone', label: 'Phone' },
    { key: 'availability', label: 'Availability' }
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
        <Input label="Specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="Cardiology" />
        <Input label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Heart Care" />
        <div className="md:col-span-4">
          <Input label="Availability" value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="Mon, 09:00" />
        </div>
      </div>
      {loading ? <Loader /> : (
        <Table
          columns={[
            { ...columns[0], render: (row) => <Link to={`/doctors/${row._id}`} className="text-primary-700 hover:underline">{row.fullName}</Link> },
            ...columns.slice(1)
          ]}
          data={doctors}
          renderActions={(doctor) => (
            <div className="flex justify-end gap-2">
              <Link to={`/doctors/${doctor._id}`}><Button variant="secondary" className="h-9 w-9 px-0" aria-label="View doctor"><Eye size={16} /></Button></Link>
              {permissions.canEditDoctor(role) && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, doctor })} aria-label="Edit doctor"><Pencil size={16} /></Button>}
              {permissions.canDeleteDoctor(role) && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(doctor)} aria-label="Delete doctor"><Trash2 size={16} /></Button>}
            </div>
          )}
        />
      )}
      <Modal open={modal.open} title={modal.doctor ? t('pages.doctorsTitle') : t('pages.newDoctor')} onClose={() => setModal({ open: false, doctor: null })}>
        <DoctorForm initialData={modal.doctor} onSubmit={saveDoctor} loading={saving} onCancel={() => setModal({ open: false, doctor: null })} />
      </Modal>
      <ConfirmDialog open={!!confirm} message={`Delete ${confirm?.fullName}?`} onCancel={() => setConfirm(null)} onConfirm={deleteDoctor} loading={saving} />
    </div>
  );
};

export default DoctorsList;
