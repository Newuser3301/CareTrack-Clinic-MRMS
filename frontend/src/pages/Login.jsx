import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Activity, LogIn } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@caretrack.com', password: 'Admin12345!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError(t('login.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('login.unable'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden min-h-screen flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
            <Activity size={26} />
          </div>
          <div>
            <p className="text-xl font-bold">{t('login.title')}</p>
            <p className="text-sm text-slate-400">Private medical records platform</p>
          </div>
        </div>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-400">{t('login.clinicalOps')}</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">{t('login.heroTitle')}</h1>
          <p className="mt-5 text-lg text-slate-300">
            {t('login.heroText')}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">RBAC</p>
              <p className="mt-1 text-sm text-slate-400">{t('login.workflows')}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">JWT</p>
              <p className="mt-1 text-sm text-slate-400">{t('login.protected')}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">MRMS</p>
              <p className="mt-1 text-sm text-slate-400">{t('login.records')}</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-500">CareTrack Clinic MRMS</p>
      </section>
      <section className="flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-600 text-white">
            <Activity size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('login.title')}</h1>
            <p className="text-sm text-slate-500">{t('login.subtitle')}</p>
          </div>
          </div>
          <LanguageSwitcher compact />
        </div>
        {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <Input label={t('common.email')} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input label={t('common.password')} type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn size={16} />
            {loading ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </form>
      </div>
      </section>
    </div>
  );
};

export default Login;
