import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

const emptyDiagnosis = { patient: '', icdCode: '', description: '', severity: 'low', notes: '', diagnosedDate: new Date().toISOString().slice(0, 10) };
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const DiagnosisForm = ({ initialData, patients, defaultPatient, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyDiagnosis);
  const [icdCodeOptions, setIcdCodeOptions] = useState([]);
  const [mkb10Query, setMkb10Query] = useState('');
  const [mkb10Options, setMkb10Options] = useState([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [mkb10Loading, setMkb10Loading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setForm(
      initialData
        ? { ...initialData, patient: initialData.patient?._id || initialData.patient, diagnosedDate: toDateInput(initialData.diagnosedDate) }
        : { ...emptyDiagnosis, patient: defaultPatient || '' }
    );
    setMkb10Query('');
  }, [initialData, defaultPatient]);

  useEffect(() => {
    const query = form.icdCode.trim();
    if (query.length < 2) {
      setIcdCodeOptions([]);
      setIcdLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIcdLoading(true);
        const { data } = await api.get('/diagnoses/icd10/search', {
          params: { terms: query, count: 10 }
        });
        if (!cancelled) setIcdCodeOptions(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setIcdCodeOptions([]);
      } finally {
        if (!cancelled) setIcdLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.icdCode]);

  useEffect(() => {
    const query = mkb10Query.trim();
    if (query.length < 2) {
      setMkb10Options([]);
      setMkb10Loading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setMkb10Loading(true);
        const { data } = await api.get('/diagnoses/mkb10/search', {
          params: { terms: query, count: 10 }
        });
        if (!cancelled) setMkb10Options(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setMkb10Options([]);
      } finally {
        if (!cancelled) setMkb10Loading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mkb10Query]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateIcdCode = (value) => {
    const selected = icdCodeOptions.find((option) => option.code.toLowerCase() === value.trim().toLowerCase());
    setForm((current) => ({
      ...current,
      icdCode: value.toUpperCase(),
      description: selected ? selected.name : current.description
    }));
  };
  const updateMkb10Query = (value) => {
    const selected = mkb10Options.find((option) => option.name.toLowerCase() === value.trim().toLowerCase());
    setMkb10Query(value);
    if (selected) {
      setForm((current) => ({
        ...current,
        icdCode: selected.code,
        description: selected.description || selected.name
      }));
    }
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
            <option key={option.code} value={option.code} label={option.name} />
          ))}
        </datalist>
        {icdLoading && <span className="mt-1 block text-sm text-slate-500">ICD-10-CM qidirilmoqda...</span>}
      </label>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-extrabold text-slate-600">MKB-10 nomi</span>
        <input
          list="mkb10-name-options"
          className="focus-ring w-full rounded-[1.15rem] border border-sky-100 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400"
          value={mkb10Query}
          onChange={(event) => updateMkb10Query(event.target.value)}
          placeholder="Kasallik nomini yozing"
        />
        <datalist id="mkb10-name-options">
          {mkb10Options.map((option) => (
            <option key={`${option.code}-${option.name}`} value={option.name} label={`${option.code} - ${option.name}`} />
          ))}
        </datalist>
        {mkb10Loading && <span className="mt-1 block text-sm text-slate-500">MKB-10 qidirilmoqda...</span>}
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
      <div className="sticky bottom-0 flex justify-end gap-3 bg-sky-50/95 pt-4 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? t('common.saving') : t('forms.saveDiagnosis')}</Button>
      </div>
    </form>
  );
};

export default DiagnosisForm;
