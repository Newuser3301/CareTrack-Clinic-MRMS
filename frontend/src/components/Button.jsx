const variants = {
  primary: 'bg-primary-700 text-white shadow-panel hover:bg-slate-950',
  secondary: 'bg-white/85 text-slate-700 border border-white/70 shadow-sm hover:bg-white',
  danger: 'bg-red-500 text-white shadow-panel hover:bg-red-600',
  ghost: 'bg-white/50 text-slate-700 hover:bg-white'
};

const Button = ({ children, variant = 'primary', className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2 text-sm font-extrabold tracking-normal transition disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
