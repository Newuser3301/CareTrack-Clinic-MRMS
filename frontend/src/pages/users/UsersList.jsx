import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import UserForm from './UserForm';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { roleLabel } from '../../utils/permissions';

const UsersList = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, user: null });
  const [confirm, setConfirm] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const saveUser = async (payload) => {
    setSaving(true);
    try {
      if (modal.user) await api.put(`/users/${modal.user._id}`, payload);
      else await api.post('/users', payload);
      setModal({ open: false, user: null });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${confirm._id}`);
      setConfirm(null);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToDelete'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pages.usersTitle')}</h1>
          <p className="text-sm text-slate-500">{t('pages.usersSubtitle')}</p>
        </div>
        <Button onClick={() => setModal({ open: true, user: null })}><Plus size={16} />{t('pages.newUser')}</Button>
      </div>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'name', label: t('common.name'), render: (row) => <Link to={`/users/${row._id}`} className="text-primary-700 hover:underline">{row.name}</Link> },
            { key: 'email', label: t('common.email') },
            { key: 'role', label: t('common.role'), render: (row) => <Badge tone={row.role}>{t(`roles.${row.role}`, roleLabel(row.role))}</Badge> },
            { key: 'createdAt', label: t('common.created'), render: (row) => new Date(row.createdAt).toLocaleDateString() }
          ]}
          data={users}
          renderActions={(user) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, user })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>
              <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(user)} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>
            </div>
          )}
        />
      )}
      <Modal open={modal.open} title={modal.user ? t('pages.usersTitle') : t('pages.newUser')} onClose={() => setModal({ open: false, user: null })}>
        <UserForm
          initialData={modal.user}
          currentRole={currentUser?.role}
          onSubmit={saveUser}
          loading={saving}
          onCancel={() => setModal({ open: false, user: null })}
        />
      </Modal>
      <ConfirmDialog open={!!confirm} message={`${t('common.delete')} ${confirm?.name}?`} onCancel={() => setConfirm(null)} onConfirm={deleteUser} loading={saving} />
    </div>
  );
};

export default UsersList;
