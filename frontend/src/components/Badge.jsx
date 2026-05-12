const styles = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
  admin: 'bg-blue-100 text-blue-700',
  clinician: 'bg-green-100 text-green-700',
  receptionist: 'bg-slate-100 text-slate-700'
};

const Badge = ({ children, tone }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[tone] || 'bg-slate-100 text-slate-700'}`}>
    {children}
  </span>
);

export default Badge;
