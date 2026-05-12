const Input = ({ label, error, className = '', ...props }) => (
  <label className="block">
    {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
    <input
      className={`focus-ring w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ${className}`}
      {...props}
    />
    {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
  </label>
);

export default Input;
