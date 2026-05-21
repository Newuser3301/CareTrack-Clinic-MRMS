import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';

const priorities = ['low', 'normal', 'high', 'urgent'];
const statuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];

const ReferralForm = ({ patients = [], doctors = [], initialData, onSubmit, loading, onCancel }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    patient: '',
    toDoctor: '',
    toDepartment: '',
    reason: '',
    notes: '',
    priority: 'normal',
    status: 'pending'
  });

  useEffect(() => {
    if (!initialData) return;
    setForm({
      patient: initialData.patient?._id || '',
      toDoctor: initialData.toDoctor?._id || '',
      toDepartment: initialData.toDepartment || '',
      reason: initialData.reason || '',
      notes: initialData.notes || '',
      priority: initialData.priority || 'normal',
      status: initialData.status || 'pending'
    });
  }, [initialData]);

  const patientOptions = useMemo(
    () => patients.map((p) => ({ value: p._id, label: `${p.fullName} (${p.phone || '-'})` })),
    [patients]
  );
  const doctorOptions = useMemo(
    () => [{ value: '', label: t('common.cancel', 'Tanlanmagan') }, ...doctors.map((d) => ({ value: d._id, label: d.fullName }))],
    [doctors]
  );

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      patient: form.patient,
      toDoctor: form.toDoctor || undefined,
      toDepartment: form.toDepartment || '',
      reason: form.reason,
      notes: form.notes || '',
      priority: form.priority,
      status: form.status
    });
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Select
        label={t('nav.patients')}
        value={form.patient}
        onChange={(event) => setForm((s) => ({ ...s, patient: event.target.value }))}
        options={patientOptions}
        required
        disabled={Boolean(initialData)}
      />
      <Select
        label={t('reports.assignedDoctor', 'Biriktirilgan shifokor')}
        value={form.toDoctor}
        onChange={(event) => setForm((s) => ({ ...s, toDoctor: event.target.value }))}
        options={doctorOptions}
      />
      <Input
        label={t('forms.department', "Bo'lim")}
        value={form.toDepartment}
        onChange={(event) => setForm((s) => ({ ...s, toDepartment: event.target.value }))}
        placeholder={t('placeholders.departmentExample')}
      />
      <Input
        label={t('common.description', 'Sabab')}
        value={form.reason}
        onChange={(event) => setForm((s) => ({ ...s, reason: event.target.value }))}
        required
      />
      <Input
        label={t('diagnoses.notes', 'Izoh')}
        value={form.notes}
        onChange={(event) => setForm((s) => ({ ...s, notes: event.target.value }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t('common.severity', 'Ustuvorlik')}
          value={form.priority}
          onChange={(event) => setForm((s) => ({ ...s, priority: event.target.value }))}
          options={priorities.map((p) => ({ value: p, label: p }))}
        />
        <Select
          label={t('common.actions', 'Holat')}
          value={form.status}
          onChange={(event) => setForm((s) => ({ ...s, status: event.target.value }))}
          options={statuses.map((s) => ({ value: s, label: s }))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </div>
    </form>
  );
};

export default ReferralForm;

