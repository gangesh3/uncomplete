import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  QrCode, LayoutDashboard, Store, MessageSquare, Library,
  LogOut, Menu, X, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function DashboardLayout() {
  const { user, profile, isAdmin, signOut, loading, roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/login', { state: { from: location.pathname }, replace: true });
    return null;
  }

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Cafés', to: '/dashboard/cafes', icon: Store, adminOnly: true },
    { label: 'Feedback Inbox', to: '/dashboard/feedback', icon: MessageSquare },
    { label: 'Preset Library', to: '/dashboard/presets', icon: Library },
  ];

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  function handleSignOut() {
    signOut();
    navigate('/');
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">CaféQR</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to, item.exact)
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-slate-900 truncate">
              {profile?.display_name || user.email}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-white">
                Platform Admin
              </span>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-slate-600"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              to="/c/brewbite-cafe"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
            >
              View demo <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
