import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, XCircle } from 'lucide-react';
import api from '../../api/axios';
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
import RegistrationForm from './RegistrationForm';

const RegistrationsList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const [items, setItems] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [approveModal, setApproveModal] = useState({ open: false, item: null, password: '' });
  const [rejectModal, setRejectModal] = useState({ open: false, item: null, reason: '' });

  const canCreate = permissions.canCreateRegistration(role);
  const canApprove = permissions.canApproveRegistrations(role);

  const loadDoctors = async () => {
    try {
      const { data } = await api.get('/doctors', { params: { search: '' } });
      setDoctors(data || []);
    } catch {
      setDoctors([]);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/registrations', { params: { search: search || undefined, status: status || undefined } });
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadItems, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  const createRegistration = async (payload) => {
    setSaving(true);
    try {
      await api.post('/registrations', payload);
      setCreateOpen(false);
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    setSaving(true);
    try {
      await api.post(`/registrations/${approveModal.item._id}/approve`, { password: approveModal.password });
      setApproveModal({ open: false, item: null, password: '' });
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    setSaving(true);
    try {
      await api.post(`/registrations/${rejectModal.item._id}/reject`, { rejectionReason: rejectModal.reason });
      setRejectModal({ open: false, item: null, reason: '' });
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('common.search', 'Barchasi') },
      ...['pending', 'approved', 'rejected'].map((s) => ({ value: s, label: s }))
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.registrations', 'Ro‘yxatga olish')}</h1>
          <p className="text-sm text-slate-500">{t('registrations.subtitle', 'Yangi bemor ro‘yxatga olishlarini topshirish va ko‘rib chiqish.')}</p>
        </div>
        {canCreate && <Button onClick={() => setCreateOpen(true)}><Plus size={16} />{t('registrations.new', 'Yangi ariza')}</Button>}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-3">
          <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')}...`} />
        </div>
        <Select label={t('registrations.status', 'Status')} value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
      </div>

      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'fullName', label: t('common.name') },
            { key: 'phone', label: t('common.phone') },
            { key: 'email', label: t('common.email') },
            { key: 'status', label: t('registrations.status', 'Status') }
          ]}
          data={items}
          renderActions={(row) => (
            <div className="flex justify-end gap-2">
              {canApprove && row.status === 'pending' && (
                <>
                  <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setApproveModal({ open: true, item: row, password: '' })} aria-label={t('registrations.approve', 'Tasdiqlash')}>
                    <CheckCircle2 size={16} />
                  </Button>
                  <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setRejectModal({ open: true, item: row, reason: '' })} aria-label={t('registrations.reject', 'Rad etish')}>
                    <XCircle size={16} />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      )}

      <Modal open={createOpen} title={t('registrations.new', 'Yangi ariza')} onClose={() => setCreateOpen(false)}>
        <RegistrationForm doctors={doctors} onSubmit={createRegistration} loading={saving} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={approveModal.open} title={t('registrations.approve', 'Arizani tasdiqlash')} onClose={() => setApproveModal({ open: false, item: null, password: '' })}>
        <div className="space-y-4">
          <div className="text-sm text-slate-600">{approveModal.item?.fullName} — {approveModal.item?.email}</div>
          <Input label={t('common.password')} type="password" value={approveModal.password} onChange={(e) => setApproveModal((s) => ({ ...s, password: e.target.value }))} required />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApproveModal({ open: false, item: null, password: '' })}>{t('common.cancel')}</Button>
            <Button onClick={approve} disabled={saving || !approveModal.password}>{saving ? t('common.saving') : t('registrations.approve', 'Tasdiqlash')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={rejectModal.open} title={t('registrations.reject', 'Arizani rad etish')} onClose={() => setRejectModal({ open: false, item: null, reason: '' })}>
        <div className="space-y-4">
          <div className="text-sm text-slate-600">{rejectModal.item?.fullName} — {rejectModal.item?.email}</div>
          <Input label={t('registrations.reason', 'Sabab')} value={rejectModal.reason} onChange={(e) => setRejectModal((s) => ({ ...s, reason: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, item: null, reason: '' })}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={reject} disabled={saving}>{saving ? t('common.saving') : t('registrations.reject', 'Rad etish')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegistrationsList;

