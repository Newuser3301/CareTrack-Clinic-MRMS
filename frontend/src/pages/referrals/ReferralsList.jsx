import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
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
import ReferralForm from './ReferralForm';

const ReferralsList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, referral: null });
  const [confirm, setConfirm] = useState(null);

  const canCreate = permissions.canCreateReferral(role);
  const canEdit = permissions.canEditReferral(role);
  const canDelete = permissions.canDeleteReferral(role);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/referrals', { params: { search: search || undefined, status: status || undefined } });
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    if (!canCreate && !canEdit) return;
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get('/patients', { params: { search: '' } }),
        api.get('/doctors', { params: { search: '' } })
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch {
      // lookups are optional for read-only view
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadReferrals, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  const saveReferral = async (payload) => {
    setSaving(true);
    try {
      if (modal.referral) await api.put(`/referrals/${modal.referral._id}`, payload);
      else await api.post('/referrals', payload);
      setModal({ open: false, referral: null });
      await loadReferrals();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const deleteReferral = async () => {
    setSaving(true);
    try {
      await api.delete(`/referrals/${confirm._id}`);
      setConfirm(null);
      await loadReferrals();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToDelete'));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('common.search', 'Barchasi') },
      ...['pending', 'accepted', 'rejected', 'completed', 'cancelled'].map((s) => ({ value: s, label: s }))
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.referrals', 'Yo‘llanmalar')}</h1>
          <p className="text-sm text-slate-500">{t('referrals.subtitle', 'Bo‘limlar o‘rtasida yo‘llanmalarni boshqarish.')}</p>
        </div>
        {canCreate && <Button onClick={() => setModal({ open: true, referral: null })}><Plus size={16} />{t('referrals.new', 'Yangi yo‘llanma')}</Button>}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-3">
          <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')}...`} />
        </div>
        <Select label={t('common.actions', 'Holat')} value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
      </div>

      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'patient', label: t('nav.patients'), render: (row) => row.patient?.fullName || '-' },
            { key: 'toDepartment', label: t('forms.department', "Bo'lim"), render: (row) => row.toDepartment || '-' },
            { key: 'toDoctor', label: t('nav.doctors'), render: (row) => row.toDoctor?.fullName || '-' },
            { key: 'priority', label: t('referrals.priority', 'Ustuvorlik'), render: (row) => row.priority },
            { key: 'status', label: t('referrals.status', 'Holat'), render: (row) => row.status }
          ]}
          data={items}
          renderActions={(row) => (
            <div className="flex justify-end gap-2">
              {canEdit && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, referral: row })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>}
              {canDelete && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(row)} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>}
            </div>
          )}
        />
      )}

      <Modal open={modal.open} title={modal.referral ? t('nav.referrals', 'Yo‘llanma') : t('referrals.new', 'Yangi yo‘llanma')} onClose={() => setModal({ open: false, referral: null })}>
        <ReferralForm
          patients={patients}
          doctors={doctors}
          initialData={modal.referral}
          onSubmit={saveReferral}
          loading={saving}
          onCancel={() => setModal({ open: false, referral: null })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        message={`${t('common.delete')} ${confirm?.patient?.fullName || ''}?`}
        onCancel={() => setConfirm(null)}
        onConfirm={deleteReferral}
        loading={saving}
      />
    </div>
  );
};

export default ReferralsList;

