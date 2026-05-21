import { useMemo, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';

const RegistrationForm = ({ doctors = [], onSubmit, loading, onCancel }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'female',
    phone: '',
    email: '',
    address: '',
    assignedDoctor: '',
    emergencyContact: ''
  });

  const doctorOptions = useMemo(
    () => doctors.map((d) => ({ value: d._id, label: `${d.fullName} • ${d.specialty || ''}` })),
    [doctors]
  );

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form });
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Input label={t('common.name')} value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t('common.date')} type="date" value={form.dateOfBirth} onChange={(e) => setForm((s) => ({ ...s, dateOfBirth: e.target.value }))} required />
        <Select
          label={t('common.gender')}
          value={form.gender}
          onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}
          options={[
            { value: 'female', label: t('forms.female', 'Female') },
            { value: 'male', label: t('forms.male', 'Male') },
            { value: 'other', label: t('forms.other', 'Other') }
          ]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t('common.phone')} value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} required />
        <Input label={t('common.email')} value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
      </div>
      <Input label={t('common.address')} value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} required />
      <Select label={t('reports.assignedDoctor', 'Biriktirilgan shifokor')} value={form.assignedDoctor} onChange={(e) => setForm((s) => ({ ...s, assignedDoctor: e.target.value }))} options={doctorOptions} required />
      <Input label={t('registrations.emergencyContact', 'Favqulodda aloqa')} value={form.emergencyContact} onChange={(e) => setForm((s) => ({ ...s, emergencyContact: e.target.value }))} required />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </div>
    </form>
  );
};

export default RegistrationForm;

