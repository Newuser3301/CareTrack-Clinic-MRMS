import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';

const emptyDiagnosis = { patient: '', icdCode: '', description: '', severity: 'low', notes: '', diagnosedDate: new Date().toISOString().slice(0, 10) };
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const icdCodeOptions = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'R51.9', description: 'Headache, unspecified' }
];

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
  const updateIcdCode = (value) => {
    const selected = icdCodeOptions.find((option) => option.code.toLowerCase() === value.trim().toLowerCase());
    setForm((current) => ({
      ...current,
      icdCode: value.toUpperCase(),
      description: selected && !current.description ? selected.description : current.description
    }));
  };
  const selectIcdCode = (option) => {
    setForm((current) => ({
      ...current,
      icdCode: option.code,
      description: current.description || option.description
    }));
  };

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
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-slate-600">{t('forms.icdCode')}</span>
        <input
          list="icd-code-options"
          className="focus-ring w-full rounded-[1.15rem] border border-sky-100 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400"
          value={form.icdCode}
          onChange={(event) => updateIcdCode(event.target.value)}
          placeholder="E11.9"
          required
        />
        <datalist id="icd-code-options">
          {icdCodeOptions.map((option) => (
            <option key={option.code} value={option.code} label={option.description} />
          ))}
        </datalist>
        <div className="mt-2 flex flex-wrap gap-2">
          {icdCodeOptions.slice(0, 6).map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => selectIcdCode(option)}
              className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-primary-700 transition hover:bg-sky-100"
              title={option.description}
            >
              {option.code}
            </button>
          ))}
        </div>
      </label>
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
