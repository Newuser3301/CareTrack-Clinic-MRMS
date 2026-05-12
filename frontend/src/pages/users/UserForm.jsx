import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';

const emptyUser = { name: '', email: '', password: '', role: 'receptionist' };

const UserForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(emptyUser);

  useEffect(() => {
    setForm(initialData ? { ...initialData, password: '' } : emptyUser);
  }, [initialData]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Input label="Name" value={form.name} onChange={(event) => update('name', event.target.value)} required />
      <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
      <Input label={initialData ? 'Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={(event) => update('password', event.target.value)} required={!initialData} />
      <Select label="Role" value={form.role} onChange={(event) => update('role', event.target.value)} options={[
        { value: 'admin', label: 'Admin' },
        { value: 'clinician', label: 'Clinician' },
        { value: 'receptionist', label: 'Receptionist' }
      ]} required />
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save user'}</Button>
      </div>
    </form>
  );
};

export default UserForm;
