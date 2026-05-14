import { useEffect, useState } from 'react';
import { RefreshCw, Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useLanguage } from '../../context/LanguageContext';
import { generateStrongPassword } from '../../utils/passwords';

const emptyDoctor = { fullName: '', specialty: '', department: '', phone: '', email: '', availability: '', password: '' };

const DoctorForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyDoctor);
  const { t } = useLanguage();

  useEffect(() => {
    setForm(initialData ? { ...initialData, password: '' } : { ...emptyDoctor, password: generateStrongPassword() });
  }, [initialData]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const suggestPassword = () => update('password', generateStrongPassword());

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
      <Input label={t('forms.fullName')} value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required />
      <Input label={t('forms.specialty')} value={form.specialty} onChange={(event) => update('specialty', event.target.value)} required />
      <Input label={t('forms.department')} value={form.department} onChange={(event) => update('department', event.target.value)} required />
      <Input label={t('common.phone')} value={form.phone} onChange={(event) => update('phone', event.target.value)} required />
      <Input label={t('common.email')} type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
      <Input label={t('forms.availability')} value={form.availability} onChange={(event) => update('availability', event.target.value)} required />
      <div className="space-y-2">
        <Input
          label={initialData ? t('forms.passwordKeep') : t('forms.accountPassword')}
          type="text"
          minLength={12}
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          helper={!initialData ? t('forms.passwordSuggestionHelp') : undefined}
          required={!initialData}
        />
        {!initialData && (
          <div className="flex justify-end">
            <Button variant="ghost" className="min-h-10 px-3" onClick={suggestPassword}><RefreshCw size={16} />{t('forms.refreshSuggestedPassword')}</Button>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? t('common.saving') : t('forms.saveDoctor')}</Button>
      </div>
    </form>
  );
};

export default DoctorForm;
