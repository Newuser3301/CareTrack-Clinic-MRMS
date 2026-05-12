import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import Table from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../utils/permissions';
import PatientForm from './PatientForm';

const PatientsList = () => {
  const { user } = useAuth();
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
      setError(err.response?.data?.message || 'Unable to load patients.');
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
      setError(err.response?.data?.message || 'Unable to save patient.');
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
      setError(err.response?.data?.message || 'Unable to delete patient.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500">Register patients and manage doctor assignments.</p>
        </div>
        {permissions.canCreatePatient(role) && <Button onClick={() => setModal({ open: true, patient: null })}><Plus size={16} />New patient</Button>}
      </div>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search patients by name or phone..." />
        </div>
        {permissions.canChangePatientDoctor(role) && (
          <Select
            value={assignedDoctor}
            onChange={(event) => setAssignedDoctor(event.target.value)}
            placeholder="All assigned doctors"
            options={doctors.map((doctor) => ({ value: doctor._id, label: `${doctor.fullName} · ${doctor.specialty}` }))}
          />
        )}
      </div>
      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'fullName', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'gender', label: 'Gender' },
            { key: 'assignedDoctor', label: 'Doctor', render: (row) => row.assignedDoctor?.fullName || '-' },
            { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() }
          ]}
          data={patients}
          renderActions={(patient) => (
            <div className="flex justify-end gap-2">
              <Link to={`/patients/${patient._id}`}><Button variant="secondary" className="h-9 w-9 px-0" aria-label="View patient"><Eye size={16} /></Button></Link>
              {permissions.canEditPatient(role) && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, patient })} aria-label="Edit patient"><Pencil size={16} /></Button>}
              {permissions.canDeletePatient(role) && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(patient)} aria-label="Delete patient"><Trash2 size={16} /></Button>}
            </div>
          )}
        />
      )}
      <Modal open={modal.open} title={modal.patient ? 'Edit patient' : 'Create patient'} onClose={() => setModal({ open: false, patient: null })}>
        <PatientForm
          initialData={modal.patient}
          doctors={permissions.canChangePatientDoctor(role) ? doctors : modal.patient?.assignedDoctor ? [modal.patient.assignedDoctor] : []}
          canChangeDoctor={permissions.canChangePatientDoctor(role)}
          onSubmit={savePatient}
          loading={saving}
          onCancel={() => setModal({ open: false, patient: null })}
        />
      </Modal>
      <ConfirmDialog open={!!confirm} message={`Delete ${confirm?.fullName} and linked diagnoses?`} onCancel={() => setConfirm(null)} onConfirm={deletePatient} loading={saving} />
    </div>
  );
};

export default PatientsList;
