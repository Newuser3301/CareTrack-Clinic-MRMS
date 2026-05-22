const styles = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-rose-100 text-rose-700',
  super_admin: 'bg-rose-100 text-rose-700',
  admin: 'bg-sky-100 text-sky-700',
  doctor: 'bg-emerald-100 text-emerald-700',
  patient: 'bg-slate-100 text-slate-700'
};

const Badge = ({ children, tone }) => (
  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize shadow-sm ${styles[tone] || 'bg-slate-100 text-slate-700'}`}>
    {children}
  </span>
);

export default Badge;
