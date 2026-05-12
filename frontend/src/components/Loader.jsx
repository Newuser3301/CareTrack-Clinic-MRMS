const Loader = ({ fullScreen = false }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
  </div>
);

export default Loader;
