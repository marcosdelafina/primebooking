import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Scissors, 
  Users, 
  UserCircle, 
  Calendar, 
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Serviços', href: '/admin/services', icon: Scissors },
  { name: 'Profissionais', href: '/admin/professionals', icon: Users },
  { name: 'Clientes', href: '/admin/clients', icon: UserCircle },
  { name: 'Agendamentos', href: '/admin/appointments', icon: Calendar },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  // Mobile bottom navigation (top 4 items)
  const mobileNav = navigation.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 px-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-primary">PrimeBooking</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
          isMobile
            ? sidebarOpen
              ? 'translate-x-0 w-72'
              : '-translate-x-full w-72'
            : sidebarCollapsed
              ? 'w-20'
              : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            'h-16 flex items-center border-b border-sidebar-border px-4',
            sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'
          )}>
            {(!sidebarCollapsed || isMobile) && (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-sidebar-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-sidebar-foreground">PrimeBooking</span>
              </div>
            )}
            {isMobile ? (
              <button
                onClick={closeSidebar}
                className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
              >
                <ChevronLeft className={cn(
                  'h-5 w-5 transition-transform',
                  sidebarCollapsed && 'rotate-180'
                )} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    sidebarCollapsed && !isMobile && 'justify-center px-2'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!sidebarCollapsed || isMobile) && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User Section */}
          <div className={cn(
            'p-3 border-t border-sidebar-border',
            sidebarCollapsed && !isMobile && 'flex justify-center'
          )}>
            {(!sidebarCollapsed || isMobile) && user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-sm font-semibold text-sidebar-accent-foreground">
                    {user.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                sidebarCollapsed && !isMobile && 'w-auto px-2'
              )}
              onClick={logout}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {(!sidebarCollapsed || isMobile) && <span className="ml-3">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          isMobile
            ? 'pt-16 pb-20'
            : sidebarCollapsed
              ? 'pl-20'
              : 'pl-64'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center justify-around px-2">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
