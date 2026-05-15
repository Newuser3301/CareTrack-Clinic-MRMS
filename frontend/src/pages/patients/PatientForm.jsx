import { useEffect, useState } from 'react';
import { RefreshCw, Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';
import { generateStrongPassword } from '../../utils/passwords';

const emptyPatient = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  assignedDoctor: '',
  emergencyContact: '',
  password: ''
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const PatientForm = ({ initialData, doctors, canChangeDoctor = true, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyPatient);
  const { t } = useLanguage();

  useEffect(() => {
    setForm(
      initialData
        ? { ...initialData, dateOfBirth: toDateInput(initialData.dateOfBirth), assignedDoctor: initialData.assignedDoctor?._id || initialData.assignedDoctor }
        : { ...emptyPatient, password: generateStrongPassword() }
    );
  }, [initialData]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const suggestPassword = () => update('password', generateStrongPassword());

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Input label={t('forms.fullName')} value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required />
      <Input label={t('forms.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} required />
      <Select label={t('common.gender')} value={form.gender} onChange={(event) => update('gender', event.target.value)} placeholder={t('forms.selectGender')} options={[
        { value: 'female', label: t('forms.female') },
        { value: 'male', label: t('forms.male') },
        { value: 'other', label: t('forms.other') }
      ]} required />
      <Input label={t('common.phone')} value={form.phone} onChange={(event) => update('phone', event.target.value)} required />
      <Input label={t('common.email')} type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
      <Input label={t('common.address')} value={form.address} onChange={(event) => update('address', event.target.value)} required />
      <Select
        label={t('forms.assignedDoctor')}
        value={form.assignedDoctor}
        onChange={(event) => update('assignedDoctor', event.target.value)}
        placeholder={t('forms.selectDoctor')}
        options={doctors.map((doctor) => ({ value: doctor._id, label: `${doctor.fullName} · ${doctor.specialty}` }))}
        disabled={!canChangeDoctor}
        required
      />
      <Input className="md:col-span-2" label={t('forms.emergencyContact')} value={form.emergencyContact} onChange={(event) => update('emergencyContact', event.target.value)} required />
      <div className="space-y-2 md:col-span-2">
        <Input
          label={initialData ? t('forms.passwordKeep') : t('forms.accountPassword')}
          type="text"
          minLength={12}
          value={form.password || ''}
          onChange={(event) => update('password', event.target.value)}
          helper={initialData ? t('forms.passwordAdminAccessHelp') : t('forms.passwordSuggestionHelp')}
          required={!initialData}
        />
        <div className="flex justify-end">
          <Button variant="ghost" className="min-h-10 px-3" onClick={suggestPassword}><RefreshCw size={16} />{t('forms.refreshSuggestedPassword')}</Button>
        </div>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-3 bg-cyan-50/96 pt-4 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? t('common.saving') : t('forms.savePatient')}</Button>
      </div>
    </form>
  );
};

export default PatientForm;
