import { useEffect, useState } from 'react';
import { RefreshCw, Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';
import { generateStrongPassword } from '../../utils/passwords';

const emptyUser = { name: '', email: '', password: '', role: 'patient' };

const UserForm = ({ initialData, currentRole, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyUser);
  const { t } = useLanguage();

  useEffect(() => {
    setForm(initialData ? { ...initialData, password: '' } : { ...emptyUser, password: generateStrongPassword() });
  }, [initialData]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const suggestPassword = () => update('password', generateStrongPassword());

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Input label={t('common.name')} value={form.name} onChange={(event) => update('name', event.target.value)} required />
      <Input label={t('common.email')} type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
      <div className="space-y-2">
        <Input
          label={initialData ? t('forms.passwordKeep') : t('common.password')}
          type="text"
          minLength={12}
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          helper={initialData ? t('forms.passwordAdminAccessHelp') : t('forms.passwordSuggestionHelp')}
          required={!initialData}
        />
        <div className="flex justify-end">
          <Button variant="ghost" className="min-h-10 px-3" onClick={suggestPassword}><RefreshCw size={16} />{t('forms.refreshSuggestedPassword')}</Button>
        </div>
      </div>
      <Select
        label={t('common.role')}
        value={form.role}
        onChange={(event) => update('role', event.target.value)}
        options={(currentRole === 'super_admin'
          ? [
              { value: 'super_admin', label: t('roles.super_admin') },
              { value: 'admin', label: t('roles.admin') },
              { value: 'doctor', label: t('roles.doctor') },
              { value: 'patient', label: t('roles.patient') }
            ]
          : [
              { value: 'doctor', label: t('roles.doctor') },
              { value: 'patient', label: t('roles.patient') }
            ])}
        required
      />
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? t('common.saving') : t('forms.saveUser')}</Button>
      </div>
    </form>
  );
};

export default UserForm;
