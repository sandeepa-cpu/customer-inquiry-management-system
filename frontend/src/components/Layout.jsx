import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

const navClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700',
    isActive ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-teal-700 focus:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <Link
              to="/"
              className="text-lg font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              CIMS
            </Link>
            <p className="text-sm text-slate-500">Customer Inquiry Management</p>
          </div>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/inquiries/new" className={navClass}>
              New inquiry
            </NavLink>
            <span className="px-2 text-sm text-slate-500">{user?.name ?? 'Staff'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-[960px] px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
