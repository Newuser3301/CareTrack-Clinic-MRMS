import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const EmergencyForm = ({ patients = [], onSubmit, loading, onCancel }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ patient: '', department: '', subject: '', message: '' });

  useEffect(() => {
    if (user?.role === 'patient') setForm((s) => ({ ...s, patient: '' }));
  }, [user?.role]);

  const patientOptions = useMemo(
    () => [{ value: '', label: t('common.search', 'Tanlanmagan') }, ...patients.map((p) => ({ value: p._id, label: `${p.fullName} (${p.phone || '-'})` }))],
    [patients]
  );

  const submit = (event) => {
    event.preventDefault();
    const payload = { department: form.department || '', subject: form.subject, message: form.message };
    if (user?.role !== 'patient' && form.patient) payload.patient = form.patient;
    onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      {user?.role !== 'patient' && (
        <Select label={t('nav.patients')} value={form.patient} onChange={(e) => setForm((s) => ({ ...s, patient: e.target.value }))} options={patientOptions} />
      )}
      <Input label={t('forms.department', "Bo'lim")} value={form.department} onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))} placeholder={t('placeholders.departmentExample')} />
      <Input label={t('emergencies.subject', 'Mavzu')} value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} required />
      <Input label={t('emergencies.message', 'Xabar')} value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} required />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </div>
    </form>
  );
};

export default EmergencyForm;

