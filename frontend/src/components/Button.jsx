const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
};

const Button = ({ children, variant = 'primary', className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
