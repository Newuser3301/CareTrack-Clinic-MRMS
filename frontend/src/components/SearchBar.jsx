import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search records...' }) => (
  <div className="relative w-full max-w-md">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="focus-ring w-full rounded-2xl border border-white/80 bg-white/80 py-3 pl-12 pr-4 text-sm font-semibold shadow-sm placeholder:text-slate-400"
    />
  </div>
);

export default SearchBar;
