export const permissions = {
  canManageUsers: (role) => ['super_admin', 'admin'].includes(role),
  canCreateAdmin: (role) => role === 'super_admin',
  canCreateDoctor: (role) => ['super_admin', 'admin'].includes(role),
  canEditDoctor: (role) => ['super_admin', 'admin'].includes(role),
  canDeleteDoctor: (role) => ['super_admin', 'admin'].includes(role),
  canViewDoctors: (role) => ['super_admin', 'admin', 'doctor', 'receptionist'].includes(role),
  canChangePatientDoctor: (role) => ['super_admin', 'admin', 'receptionist'].includes(role),
  canCreatePatient: (role) => ['super_admin', 'admin', 'receptionist'].includes(role),
  canEditPatient: (role) => ['super_admin', 'admin', 'doctor', 'clinician'].includes(role),
  canDeletePatient: (role) => ['super_admin', 'admin'].includes(role),
  canViewPatients: (role) => ['super_admin', 'admin', 'doctor', 'clinician', 'receptionist'].includes(role),
  canViewDiagnoses: (role) => ['super_admin', 'admin', 'doctor', 'clinician'].includes(role),
  canCreateDiagnosis: (role) => ['super_admin', 'admin', 'doctor'].includes(role),
  canEditDiagnosis: (role) => ['super_admin', 'admin', 'doctor', 'clinician'].includes(role),
  canDeleteDiagnosis: (role) => ['super_admin', 'admin'].includes(role),
  canViewReferrals: (role) => ['super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'].includes(role),
  canCreateReferral: (role) => ['super_admin', 'admin', 'doctor', 'clinician'].includes(role),
  canEditReferral: (role) => ['super_admin', 'admin', 'doctor', 'clinician'].includes(role),
  canDeleteReferral: (role) => ['super_admin', 'admin'].includes(role),
  canViewRegistrations: (role) => ['super_admin', 'admin', 'receptionist'].includes(role),
  canApproveRegistrations: (role) => ['super_admin', 'admin'].includes(role),
  canCreateRegistration: (role) => ['super_admin', 'admin', 'receptionist'].includes(role),
  canViewEmergencies: (role) => ['super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'].includes(role),
  canHandleEmergencies: (role) => ['super_admin', 'admin', 'doctor', 'clinician', 'receptionist'].includes(role)
};

export const hasAnyRole = (role, allowedRoles) => allowedRoles.includes(role);

export const roleLabel = (role) =>
  ({
    super_admin: 'Super Admin',
    admin: 'Admin',
    doctor: 'Doctor',
    clinician: 'Clinician',
    receptionist: 'Receptionist',
    patient: 'Patient'
  })[role] || role;
