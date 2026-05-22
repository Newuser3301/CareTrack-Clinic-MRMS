const Select = ({ label, error, options = [], placeholder, className = '', ...props }) => (
  <label className="block">
    {label && <span className="mb-2 block text-sm font-extrabold text-slate-600">{label}</span>}
    <select
      className={`focus-ring w-full rounded-[1.15rem] border border-sky-100 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
  </label>
);

export default Select;
