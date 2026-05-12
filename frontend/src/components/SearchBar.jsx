import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search records...' }) => (
  <div className="relative w-full max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="focus-ring w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm"
    />
  </div>
);

export default SearchBar;
