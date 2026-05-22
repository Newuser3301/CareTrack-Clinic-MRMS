const variants = {
  primary: 'bg-primary-700 text-white shadow-panel hover:bg-primary-600',
  secondary: 'bg-white/90 text-slate-700 border border-sky-100 shadow-sm hover:bg-white hover:text-primary-700',
  danger: 'bg-rose-500 text-white shadow-panel hover:bg-rose-600',
  ghost: 'bg-sky-50/70 text-slate-700 hover:bg-white'
};

const Button = ({ children, variant = 'primary', className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold tracking-normal transition disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
