const Select = ({ label, error, options = [], placeholder, className = '', ...props }) => (
  <label className="block">
    {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
    <select
      className={`focus-ring w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${className}`}
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
