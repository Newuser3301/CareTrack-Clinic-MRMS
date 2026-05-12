import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';

const emptyPatient = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  address: '',
  assignedDoctor: '',
  emergencyContact: ''
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const PatientForm = ({ initialData, doctors, canChangeDoctor = true, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyPatient);

  useEffect(() => {
    setForm(
      initialData
        ? { ...initialData, dateOfBirth: toDateInput(initialData.dateOfBirth), assignedDoctor: initialData.assignedDoctor?._id || initialData.assignedDoctor }
        : emptyPatient
    );
  }, [initialData]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Input label="Full name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required />
      <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} required />
      <Select label="Gender" value={form.gender} onChange={(event) => update('gender', event.target.value)} placeholder="Select gender" options={[
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
        { value: 'other', label: 'Other' }
      ]} required />
      <Input label="Phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} required />
      <Input label="Address" value={form.address} onChange={(event) => update('address', event.target.value)} required />
      <Select
        label="Assigned doctor"
        value={form.assignedDoctor}
        onChange={(event) => update('assignedDoctor', event.target.value)}
        placeholder="Select doctor"
        options={doctors.map((doctor) => ({ value: doctor._id, label: `${doctor.fullName} · ${doctor.specialty}` }))}
        disabled={!canChangeDoctor}
        required
      />
      <Input className="md:col-span-2" label="Emergency contact" value={form.emergencyContact} onChange={(event) => update('emergencyContact', event.target.value)} required />
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />Cancel</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? 'Saving...' : 'Save patient'}</Button>
      </div>
    </form>
  );
};

export default PatientForm;
