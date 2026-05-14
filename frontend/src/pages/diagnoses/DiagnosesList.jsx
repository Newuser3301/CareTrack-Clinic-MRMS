import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import Table from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';
import DiagnosisForm from './DiagnosisForm';

const DiagnosesList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const defaultPatient = searchParams.get('patient') || '';
  const [diagnoses, setDiagnoses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [patientFilter, setPatientFilter] = useState(defaultPatient);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: !!defaultPatient && permissions.canCreateDiagnosis(user?.role), diagnosis: null });
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    setPatientFilter(defaultPatient);
  }, [defaultPatient]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [diagnosesRes, patientsRes] = await Promise.all([
        api.get('/diagnoses', {
          params: {
            search: search || undefined,
            severity: severity || undefined,
            patient: patientFilter || undefined
          }
        }),
        api.get('/patients')
      ]);
      setDiagnoses(diagnosesRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [search, severity, patientFilter]);

  const saveDiagnosis = async (payload) => {
    setSaving(true);
    try {
      if (modal.diagnosis) await api.put(`/diagnoses/${modal.diagnosis._id}`, payload);
      else await api.post('/diagnoses', payload);
      setModal({ open: false, diagnosis: null });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save diagnosis.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDiagnosis = async () => {
    setSaving(true);
    try {
      await api.delete(`/diagnoses/${confirm._id}`);
      setConfirm(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete diagnosis.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pages.diagnosesTitle')}</h1>
          <p className="text-sm text-slate-500">{t('pages.diagnosesSubtitle')}</p>
        </div>
        {permissions.canCreateDiagnosis(user?.role) && <Button onClick={() => setModal({ open: true, diagnosis: null })}><Plus size={16} />{t('pages.newDiagnosis')}</Button>}
      </div>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-3 md:flex-row">
        <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')}...`} />
        <Select
          value={patientFilter}
          onChange={(event) => setPatientFilter(event.target.value)}
          placeholder={t('pages.patientsTitle')}
          options={patients.map((patient) => ({ value: patient._id, label: patient.fullName }))}
        />
        <Select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          placeholder={t('common.severity')}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
          ]}
        />
      </div>
      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'icdCode', label: 'ICD' },
            { key: 'patient', label: t('dashboard.patients'), render: (row) => row.patient?.fullName || '-' },
            { key: 'description', label: t('common.description') },
            { key: 'severity', label: t('common.severity'), render: (row) => <Badge tone={row.severity}>{row.severity}</Badge> },
            { key: 'diagnosedDate', label: t('common.date'), render: (row) => new Date(row.diagnosedDate).toLocaleDateString() }
          ]}
          data={diagnoses}
          renderActions={(diagnosis) => (
            <div className="flex justify-end gap-2">
              {permissions.canEditDiagnosis(user?.role) && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, diagnosis })} aria-label="Edit diagnosis"><Pencil size={16} /></Button>}
              {permissions.canDeleteDiagnosis(user?.role) && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(diagnosis)} aria-label="Delete diagnosis"><Trash2 size={16} /></Button>}
            </div>
          )}
        />
      )}
      <Modal open={modal.open} title={modal.diagnosis ? t('pages.diagnosesTitle') : t('pages.newDiagnosis')} onClose={() => setModal({ open: false, diagnosis: null })}>
        <DiagnosisForm initialData={modal.diagnosis} patients={patients} defaultPatient={defaultPatient} onSubmit={saveDiagnosis} loading={saving} onCancel={() => setModal({ open: false, diagnosis: null })} />
      </Modal>
      <ConfirmDialog open={!!confirm} message={`Delete diagnosis ${confirm?.icdCode}?`} onCancel={() => setConfirm(null)} onConfirm={deleteDiagnosis} loading={saving} />
    </div>
  );
};

export default DiagnosesList;
