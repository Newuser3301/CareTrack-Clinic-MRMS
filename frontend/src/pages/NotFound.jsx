import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <h1 className="text-4xl font-bold text-slate-900">404</h1>
    <p className="mt-2 text-slate-500">The page you requested does not exist.</p>
    <Link to="/" className="mt-6">
      <Button>Back to dashboard</Button>
    </Link>
  </div>
);

export default NotFound;
