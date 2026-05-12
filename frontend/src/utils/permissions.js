export const permissions = {
  canManageUsers: (role) => role === 'admin',
  canCreateDoctor: (role) => role === 'admin',
  canEditDoctor: (role) => role === 'admin',
  canDeleteDoctor: (role) => role === 'admin',
  canViewDoctors: (role) => ['admin', 'receptionist'].includes(role),
  canChangePatientDoctor: (role) => ['admin', 'receptionist'].includes(role),
  canCreatePatient: (role) => ['admin', 'receptionist'].includes(role),
  canEditPatient: (role) => ['admin', 'clinician'].includes(role),
  canDeletePatient: (role) => role === 'admin',
  canViewPatients: (role) => ['admin', 'clinician', 'receptionist'].includes(role),
  canViewDiagnoses: (role) => ['admin', 'clinician'].includes(role),
  canCreateDiagnosis: (role) => role === 'admin',
  canEditDiagnosis: (role) => ['admin', 'clinician'].includes(role),
  canDeleteDiagnosis: (role) => role === 'admin'
};

export const hasAnyRole = (role, allowedRoles) => allowedRoles.includes(role);
