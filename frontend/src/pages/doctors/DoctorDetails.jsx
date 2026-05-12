import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Table from '../../components/Table';

const DoctorDetails = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/doctors/${id}`).then(({ data }) => setDoctor(data)).catch((err) => setError(err.response?.data?.message || 'Unable to load doctor.'));
  }, [id]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!doctor) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{doctor.fullName}</h1>
          <p className="text-sm text-slate-500">{doctor.specialty} · {doctor.department}</p>
        </div>
        <Link to="/doctors"><Button variant="secondary"><ArrowLeft size={16} />Back</Button></Link>
      </div>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <p><span className="font-semibold">Phone:</span> {doctor.phone}</p>
        <p><span className="font-semibold">Email:</span> {doctor.email}</p>
        <p><span className="font-semibold">Availability:</span> {doctor.availability}</p>
        <p><span className="font-semibold">Patients:</span> {doctor.patients?.length || 0}</p>
      </section>
      <Table
        columns={[
          { key: 'fullName', label: 'Patient' },
          { key: 'phone', label: 'Phone' },
          { key: 'gender', label: 'Gender' }
        ]}
        data={doctor.patients || []}
        emptyMessage="No patients assigned to this doctor."
      />
    </div>
  );
};

export default DoctorDetails;
