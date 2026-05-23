import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import UserForm from './UserForm';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { roleLabel } from '../../utils/permissions';

const roleOrder = ['super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'];

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

  const roleSections = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      const role = user.role || 'unknown';
      acc[role] = [...(acc[role] || []), user];
      return acc;
    }, {});

    return [...roleOrder, ...Object.keys(grouped).filter((role) => !roleOrder.includes(role))]
      .filter((role) => grouped[role]?.length)
      .map((role) => ({
        role,
        users: grouped[role].sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [users]);

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
        <div className="space-y-4">
          {roleSections.length === 0 ? (
            <div className="clinic-card px-5 py-10 text-center text-sm font-semibold text-slate-500">
              {t('common.noRecords')}
            </div>
          ) : (
            roleSections.map(({ role, users: sectionUsers }) => (
              <section key={role} className="clinic-card overflow-hidden backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-sky-50/85 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Badge tone={role}>{t(`roles.${role}`, roleLabel(role))}</Badge>
                    <span className="text-sm font-extrabold text-slate-500">{sectionUsers.length}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-sky-50">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 sm:px-5 sm:text-xs">{t('common.name')}</th>
                        <th className="px-3 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 sm:px-5 sm:text-xs">{t('common.email')}</th>
                        <th className="px-3 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 sm:px-5 sm:text-xs">{t('common.created')}</th>
                        <th className="px-3 py-3 text-right text-[11px] font-extrabold uppercase tracking-wide text-slate-500 sm:px-5 sm:text-xs">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50">
                      {sectionUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-sky-50/70">
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold sm:px-5">
                            <Link to={`/users/${user._id}`} className="text-primary-700 hover:underline">{user.name}</Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-700 sm:px-5">{user.email}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-700 sm:px-5">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-4 text-right sm:px-5">
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, user })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>
                              <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(user)} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </div>
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
