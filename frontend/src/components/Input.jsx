const Input = ({ label, error, helper, className = '', ...props }) => (
  <label className="block">
    {label && <span className="mb-2 block text-sm font-extrabold text-slate-600">{label}</span>}
    <input
      className={`focus-ring w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 ${className}`}
      {...props}
    />
    {helper && !error && <span className="mt-1 block text-sm text-slate-500">{helper}</span>}
    {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
  </label>
);

export default Input;
