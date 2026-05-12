import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';

const emptyDoctor = { fullName: '', specialty: '', department: '', phone: '', email: '', availability: '' };

const DoctorForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyDoctor);

  useEffect(() => {
    setForm(initialData || emptyDoctor);
  }, [initialData]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
      <Input label="Full name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required />
      <Input label="Specialty" value={form.specialty} onChange={(event) => update('specialty', event.target.value)} required />
      <Input label="Department" value={form.department} onChange={(event) => update('department', event.target.value)} required />
      <Input label="Phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} required />
      <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
      <Input label="Availability" value={form.availability} onChange={(event) => update('availability', event.target.value)} required />
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}><X size={16} />Cancel</Button>
        <Button type="submit" disabled={loading}><Save size={16} />{loading ? 'Saving...' : 'Save doctor'}</Button>
      </div>
    </form>
  );
};

export default DoctorForm;
