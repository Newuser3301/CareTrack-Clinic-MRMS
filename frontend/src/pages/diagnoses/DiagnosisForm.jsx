import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';

const emptyDiagnosis = { patient: '', icdCode: '', description: '', severity: 'low', notes: '', diagnosedDate: new Date().toISOString().slice(0, 10) };
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const DiagnosisForm = ({ initialData, patients, defaultPatient, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyDiagnosis);
  const { t } = useLanguage();

  useEffect(() => {
    setForm(
      initialData
        ? { ...initialData, patient: initialData.patient?._id || initialData.patient, diagnosedDate: toDateInput(initialData.diagnosedDate) }
        : { ...emptyDiagnosis, patient: defaultPatient || '' }
    );
  }, [initialData, defaultPatient]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, notes: '' }); }}>
      <Select
        label={t('dashboard.patients')}
        value={form.patient}
        onChange={(event) => update('patient', event.target.value)}
        placeholder={t('pages.patientsTitle')}
        options={patients.map((patient) => ({ value: patient._id, label: patient.fullName }))}
        required
      />
      <Input label={t('forms.icdCode')} value={form.icdCode} onChange={(event) => update('icdCode', event.target.value)} required />
      <Select
        label={t('common.severity')}
        value={form.severity}
        onChange={(event) => update('severity', event.target.value)}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' }
        ]}
        required
      />
      <Input label={t('forms.diagnosedDate')} type="date" value={form.diagnosedDate} onChange={(event) => update('diagnosedDate', event.target.value)} required />
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-extrabold text-slate-600">{t('common.description')}</span>
        <textarea
          className="focus-ring min-h-32 w-full rounded-[1.15rem] border border-sky-100 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          required
        />
      </label>
      <div className="sticky bottom-0 flex justify-end gap-3 bg-cyan-50/96 pt-4 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? t('common.saving') : t('forms.saveDiagnosis')}</Button>
      </div>
    </form>
  );
};

export default DiagnosisForm;
