import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import Table from '../../components/Table';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';
import EmergencyForm from './EmergencyForm';

const statusOptions = ['open', 'in_progress', 'resolved', 'closed'];

const EmergenciesList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, item: null, status: 'open', resolutionNote: '' });

  const canHandle = permissions.canHandleEmergencies(role);

  const loadPatients = async () => {
    if (role === 'patient') return;
    try {
      const { data } = await api.get('/patients', { params: { search: '' } });
      setPatients(data || []);
    } catch {
      setPatients([]);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/emergencies', { params: { search: search || undefined, status: status || undefined } });
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadItems, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  const create = async (payload) => {
    setSaving(true);
    try {
      await api.post('/emergencies', payload);
      setCreateOpen(false);
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    setSaving(true);
    try {
      await api.put(`/emergencies/${editModal.item._id}`, { status: editModal.status, resolutionNote: editModal.resolutionNote });
      setEditModal({ open: false, item: null, status: 'open', resolutionNote: '' });
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const selectOptions = useMemo(
    () => [
      { value: '', label: t('common.search', 'Barchasi') },
      ...statusOptions.map((s) => ({ value: s, label: s }))
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.emergencies', 'Favqulodda')}</h1>
          <p className="text-sm text-slate-500">{t('emergencies.subtitle', 'Ish vaqtidan tashqari favqulodda murojaatlar.')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} />{t('emergencies.new', 'Yangi murojaat')}</Button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-3">
          <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')}...`} />
        </div>
        <Select label={t('emergencies.status', 'Status')} value={status} onChange={(e) => setStatus(e.target.value)} options={selectOptions} />
      </div>

      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'patient', label: t('nav.patients'), render: (row) => row.patient?.fullName || '-' },
            { key: 'department', label: t('forms.department', "Bo'lim"), render: (row) => row.department || '-' },
            { key: 'subject', label: t('emergencies.subject', 'Mavzu') },
            { key: 'status', label: t('emergencies.status', 'Status'), render: (row) => <Badge>{row.status}</Badge> }
          ]}
          data={items}
          renderActions={(row) => (
            <div className="flex justify-end gap-2">
              {canHandle && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setEditModal({ open: true, item: row, status: row.status || 'open', resolutionNote: row.resolutionNote || '' })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>}
            </div>
          )}
        />
      )}

      <Modal open={createOpen} title={t('emergencies.new', 'Yangi murojaat')} onClose={() => setCreateOpen(false)}>
        <EmergencyForm patients={patients} onSubmit={create} loading={saving} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={editModal.open} title={t('emergencies.update', 'Holatni yangilash')} onClose={() => setEditModal({ open: false, item: null, status: 'open', resolutionNote: '' })}>
        <div className="space-y-4">
          <div className="text-sm text-slate-600">{editModal.item?.patient?.fullName || '-' } — {editModal.item?.subject}</div>
          <Select
            label={t('emergencies.status', 'Status')}
            value={editModal.status}
            onChange={(e) => setEditModal((s) => ({ ...s, status: e.target.value }))}
            options={statusOptions.map((s) => ({ value: s, label: s }))}
          />
          <Input
            label={t('emergencies.resolution', 'Yakuniy izoh')}
            value={editModal.resolutionNote}
            onChange={(e) => setEditModal((s) => ({ ...s, resolutionNote: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditModal({ open: false, item: null, status: 'open', resolutionNote: '' })}>{t('common.cancel')}</Button>
            <Button onClick={update} disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmergenciesList;

