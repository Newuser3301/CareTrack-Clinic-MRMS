import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Mail, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
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
const roleStyles = {
  super_admin: {
    accent: 'from-rose-500 to-pink-500',
    icon: 'bg-rose-100 text-rose-700',
    panel: 'bg-rose-50/70'
  },
  admin: {
    accent: 'from-sky-500 to-cyan-500',
    icon: 'bg-sky-100 text-sky-700',
    panel: 'bg-sky-50/70'
  },
  doctor: {
    accent: 'from-emerald-500 to-teal-500',
    icon: 'bg-emerald-100 text-emerald-700',
    panel: 'bg-emerald-50/70'
  },
  clinician: {
    accent: 'from-violet-500 to-indigo-500',
    icon: 'bg-violet-100 text-violet-700',
    panel: 'bg-violet-50/70'
  },
  receptionist: {
    accent: 'from-amber-500 to-orange-500',
    icon: 'bg-amber-100 text-amber-700',
    panel: 'bg-amber-50/70'
  },
  patient: {
    accent: 'from-slate-500 to-slate-700',
    icon: 'bg-slate-100 text-slate-700',
    panel: 'bg-slate-50/80'
  }
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

const userDisplayName = (user) => user?.name || user?.email || 'Unnamed user';
const isSameUser = (user, currentUser) => Boolean(user?._id && currentUser?._id && String(user._id) === String(currentUser._id));

const UsersList = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, user: null });
  const [confirm, setConfirm] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

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
        users: grouped[role].sort((a, b) => userDisplayName(a).localeCompare(userDisplayName(b)))
      }));
  }, [users]);

  useEffect(() => {
    if (!roleSections.length) return;
    if (!selectedRole || !roleSections.some((section) => section.role === selectedRole)) {
      setSelectedRole(roleSections[0].role);
    }
  }, [roleSections, selectedRole]);

  const activeSection = roleSections.find((section) => section.role === selectedRole) || roleSections[0];

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
    if (isSameUser(confirm, currentUser)) {
      setConfirm(null);
      setError('You cannot delete your own account');
      return;
    }

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
            <>
              <div className="clinic-card flex flex-wrap items-center gap-2 px-4 py-3 backdrop-blur">
                <span className="mr-2 text-xs font-extrabold uppercase text-slate-500">{t('common.role')}</span>
                {roleSections.map(({ role, users: sectionUsers }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 ${
                      selectedRole === role
                        ? `${roleStyles[role]?.icon || roleStyles.patient.icon} ring-2 ring-primary-500/30`
                        : 'bg-white/80 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {t(`roles.${role}`, roleLabel(role))}
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-slate-700">{sectionUsers.length}</span>
                  </button>
                ))}
                <span className="ml-auto rounded-full bg-primary-700 px-3 py-2 text-xs font-black text-white">{users.length}</span>
              </div>

              {activeSection && (() => {
                const style = roleStyles[activeSection.role] || roleStyles.patient;
                return (
                  <section className="clinic-card overflow-hidden backdrop-blur">
                    <div className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5">
                      <div className={`h-9 w-1.5 rounded-full bg-gradient-to-b ${style.accent}`} />
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={activeSection.role}>{t(`roles.${activeSection.role}`, roleLabel(activeSection.role))}</Badge>
                          <span className="text-xs font-extrabold text-slate-500">{activeSection.users.length} account</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-sky-50 border-t border-sky-100">
                      {activeSection.users.map((user) => {
                        const isCurrentUser = isSameUser(user, currentUser);

                        return (
                          <div key={user._id} className="grid gap-3 px-5 py-4 transition hover:bg-sky-50/65 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${style.icon}`}>
                                {initials(userDisplayName(user))}
                              </div>
                              <div className="min-w-0">
                                <Link to={`/users/${user._id}`} className="block truncate text-sm font-black text-primary-700 hover:underline">
                                  {userDisplayName(user)}
                                </Link>
                                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                  <CalendarDays size={13} />
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                              <Mail size={16} className="shrink-0 text-slate-400" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => setModal({ open: true, user })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>
                              <Button variant="danger" className="h-10 w-10 px-0" onClick={() => setConfirm(user)} disabled={isCurrentUser} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}
            </>
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
      <ConfirmDialog open={!!confirm} message={`${t('common.delete')} ${userDisplayName(confirm)}?`} onCancel={() => setConfirm(null)} onConfirm={deleteUser} loading={saving} />
    </div>
  );
};

export default UsersList;
