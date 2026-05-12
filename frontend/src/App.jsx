import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorsList from './pages/doctors/DoctorsList';
import DoctorDetails from './pages/doctors/DoctorDetails';
import PatientsList from './pages/patients/PatientsList';
import PatientProfile from './pages/patients/PatientProfile';
import DiagnosesList from './pages/diagnoses/DiagnosesList';
import UsersList from './pages/users/UsersList';
import NotFound from './pages/NotFound';

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<PrivateRoute />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route element={<RoleRoute allowedRoles={['admin', 'receptionist']} />}>
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="doctors/:id" element={<DoctorDetails />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin', 'clinician', 'receptionist']} />}>
          <Route path="patients" element={<PatientsList />} />
          <Route path="patients/:id" element={<PatientProfile />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin', 'clinician']} />}>
          <Route path="diagnoses" element={<DiagnosesList />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="users" element={<UsersList />} />
        </Route>
      </Route>
    </Route>
    <Route path="/404" element={<NotFound />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default App;
