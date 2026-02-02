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
  ChevronLeft,
  ShieldCheck,
  Building2,
  ChevronDown,
  Globe,
  CreditCard,
  AlertTriangle,
  Lock,
  Star
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import type { Empresa } from '@/types/entities';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const baseNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Serviços', href: '/admin/services', icon: Scissors },
  { name: 'Profissionais', href: '/admin/professionals', icon: Users },
  { name: 'Clientes', href: '/admin/clients', icon: UserCircle },
  { name: 'Agendamentos', href: '/admin/appointments', icon: Calendar },
  { name: 'Avaliações', href: '/admin/reviews', icon: Star },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, logout, impersonateCompany, resetImpersonation } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  // Fetch companies for Global Admin
  const { data: companies = [] } = useQuery({
    queryKey: ['global-switcher-companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('empresas').select('id, nome').order('nome');
      if (error) throw error;
      return data as Pick<Empresa, 'id' | 'nome'>[];
    },
    enabled: !!user?.is_admin_global,
  });

  // Fetch billing status for the active company
  const { data: billing } = useQuery({
    queryKey: ['active-company-billing', user?.empresa_id],
    queryFn: async () => {
      if (!user?.empresa_id || user.empresa_id === 'global') return null;
      const { data, error } = await supabase
        .from('billing_empresa')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.empresa_id,
  });

  const billingStatus = billing?.billing_status || 'ATIVA';
  const isSuspended = billingStatus === 'SUSPENSA' && !user?.is_admin_global;
  const isInadimplente = billingStatus === 'INADIMPLENTE' && !user?.is_admin_global;
  const isSubscriptionPage = location.pathname === '/admin/subscription';

  const activeCompany = useMemo(() => {
    return companies.find(c => c.id === user?.empresa_id);
  }, [companies, user?.empresa_id]);

  // Fetch pending reviews count for badge
  const { data: pendingReviewsCount = 0 } = useQuery({
    queryKey: ['pending-reviews-count', user?.empresa_id],
    queryFn: async () => {
      if (!user?.empresa_id || user.empresa_id === 'global') return 0;
      const { count, error } = await supabase
        .from('avaliacoes_empresa')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.empresa_id,
  });

  // Real-time updates for pending reviews badge
  useSupabaseRealtime(
    'avaliacoes_empresa',
    user?.empresa_id || undefined,
    [['pending-reviews-count', user?.empresa_id]]
  );

  const navigation = useMemo(() => {
    const nav = [...baseNavigation].map(item => {
      if (item.name === 'Avaliações' && pendingReviewsCount > 0) {
        return { ...item, badge: pendingReviewsCount };
      }
      return item;
    });

    // Add Global Admin link
    if (user?.is_admin_global) {
      nav.unshift({ name: 'Painel Global', href: '/admin/global', icon: ShieldCheck });
    }

    // Add subscription link for companies (only if not in Global Dashboard view)
    if (!location.pathname.startsWith('/admin/global')) {
      nav.push({ name: 'Minha Assinatura', href: '/admin/subscription', icon: CreditCard });
    }

    return nav;
  }, [user?.is_admin_global, location.pathname]);

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
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
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
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl overflow-hidden flex items-center justify-center shadow-soft">
                  <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-tight text-sidebar-foreground">PrimeBooking</span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-none">Agendamento Inteligente</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
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
          </div>

          {/* Context Switcher for Global Admin */}
          {user?.is_admin_global && (
            <div className="px-3 py-4 border-b border-sidebar-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between h-12 px-3 border-dashed border-2 bg-muted/30 hover:bg-muted/50 transition-all",
                      sidebarCollapsed && !isMobile && "p-0 justify-center border-none bg-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="shrink-0 h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                        {user.empresa_id === 'global' ? ( // Wait, I need a better way to check if it's the "platform" ID
                          <Globe className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {(!sidebarCollapsed || isMobile) && (
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">CONTEXTO</span>
                          <span className="text-sm font-bold truncate">
                            {location.pathname.startsWith('/admin/global') ? 'Global' : (activeCompany?.nome || 'Empresa')}
                          </span>
                        </div>
                      )}
                    </div>
                    {(!sidebarCollapsed || isMobile) && <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[240px]">
                  <DropdownMenuLabel>Alternar Visualização</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      resetImpersonation();
                      closeSidebar();
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Globe className="h-4 w-4" />
                    <span>🌐 Visão Global</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase py-1">Empresas</DropdownMenuLabel>
                  <div className="max-h-[300px] overflow-y-auto">
                    {companies.map(company => (
                      <DropdownMenuItem
                        key={company.id}
                        onClick={() => {
                          impersonateCompany(company.id);
                          closeSidebar();
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{company.nome}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

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
                  {(!sidebarCollapsed || isMobile) && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.name}</span>
                      {(item as any).badge > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] text-center">
                          {(item as any).badge}
                        </span>
                      )}
                    </div>
                  )}
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
        {/* Desktop Header */}
        {!isMobile && (
          <header className="h-16 flex items-center justify-end px-8 border-b border-border/40 sticky top-0 bg-background/50 backdrop-blur-md z-30">
            <ThemeToggle />
          </header>
        )}
        <div className="p-4 md:p-6 lg:p-8">
          {isInadimplente && !isSubscriptionPage && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 text-amber-800 animate-in fade-in slide-in-from-top-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Aviso de Cobrança em Atraso</p>
                <p className="text-xs opacity-90 text-amber-700">Verificamos uma pendência em sua assinatura. Regularize para evitar a suspensão dos serviços.</p>
              </div>
              <NavLink to="/admin/subscription">
                <Button size="sm" variant="outline" className="border-amber-200 bg-white hover:bg-amber-50 text-amber-700">
                  Ver Fatura
                </Button>
              </NavLink>
            </div>
          )}

          {isSuspended && !isSubscriptionPage ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-300">
              <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                <Lock className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">Acesso Bloqueado</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                Sua conta foi suspensa devido a pendências financeiras. Para restabelecer o acesso completo, verifique os detalhes da sua assinatura.
              </p>
              <div className="flex gap-4">
                <NavLink to="/admin/subscription">
                  <Button size="lg" className="h-12 px-8 font-bold text-base shadow-lg shadow-primary/20">
                    Ir para Minha Assinatura
                  </Button>
                </NavLink>
                <Button variant="ghost" size="lg" onClick={logout} className="h-12 px-8 font-semibold">
                  Sair do Sistema
                </Button>
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-muted/30 border border-border inline-flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Status da Conta: <strong>SUSPENSA</strong></span>
              </div>
            </div>
          ) : (
            children
          )}
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
