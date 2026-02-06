import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  Scissors,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import {
  getAgendamentos,
  getClientes,
  getProfissionais,
  getServicos
} from '@/lib/supabase-services';
import { format, isSameDay, isThisMonth, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useMemo } from 'react';


// Metric Card Component
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-destructive" />}
            <span
              className={cn(
                'text-sm font-medium',
                isPositive && 'text-success',
                isNegative && 'text-destructive'
              )}
            >
              {isPositive && '+'}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-sm text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Action Button
function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link to={href}>
      <Button
        variant="outline"
        className="h-auto flex-col gap-2 py-4 px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <Icon className="h-6 w-6" />
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </Link>
  );
}

// Today's Appointment Item
function AppointmentItem({
  time,
  date,
  clientName,
  serviceName,
  professionalName,
  status,
}: {
  time: string;
  date?: string;
  clientName: string;
  serviceName: string;
  professionalName: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    pendente: 'bg-warning/10 text-warning border-warning/20',
    confirmado: 'bg-success/10 text-success border-success/20',
    em_andamento: 'bg-primary/10 text-primary border-primary/20',
    concluido: 'bg-muted text-muted-foreground',
    cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-card transition-shadow">
      <div className="text-center min-w-[65px] shrink-0 mt-1">
        <p className="text-lg font-bold text-primary">{time}</p>
        {date && <p className="text-[10px] text-muted-foreground font-medium uppercase">{date}</p>}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium truncate">{clientName}</p>
          <Badge variant="outline" className={cn('shrink-0 hidden sm:inline-flex', statusColors[status])}>
            {statusLabels[status] || status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {serviceName} • {professionalName}
        </p>
        <div className="sm:hidden mt-0.5">
          <Badge variant="outline" className={cn('text-[10px] py-0 h-5', statusColors[status])}>
            {statusLabels[status] || status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const empresaId = user?.empresa_id || '';

  // Data Fetching
  const { data: appointments = [], isLoading: loadingApps } = useQuery({
    queryKey: ['agendamentos', empresaId],
    queryFn: () => getAgendamentos(empresaId),
    enabled: !!empresaId,
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clientes', empresaId],
    queryFn: () => getClientes(empresaId),
    enabled: !!empresaId,
  });

  const { data: professionals = [], isLoading: loadingProfs } = useQuery({
    queryKey: ['profissionais', empresaId],
    queryFn: () => getProfissionais(empresaId),
    enabled: !!empresaId,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: () => getServicos(empresaId),
    enabled: !!empresaId,
  });

  // Realtime Subscriptions
  useSupabaseRealtime('agendamentos', empresaId, [['agendamentos', empresaId]]);
  useSupabaseRealtime('clientes_empresa', empresaId, [['clientes', empresaId]]);
  useSupabaseRealtime('clientes_global', undefined, [['clientes', empresaId]]);
  useSupabaseRealtime('profissionais', empresaId, [['profissionais', empresaId]]);
  useSupabaseRealtime('servicos', empresaId, [['servicos', empresaId]]);

  const isLoading = loadingApps || loadingClients || loadingProfs || loadingServices;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Metrics Calculation
  const today = new Date();

  const nextAppointments = useMemo(() =>
    appointments
      .filter(app => {
        const startDate = parseISO(app.data_inicio);
        // Upcoming from now, excluding canceled
        return startDate >= today && app.status !== 'cancelado';
      })
      .sort((a, b) => parseISO(a.data_inicio).getTime() - parseISO(b.data_inicio).getTime()),
    [appointments]
  );

  const pendingConfirmations = useMemo(() =>
    appointments.filter(app => app.status === 'pendente').length,
    [appointments]
  );

  const monthlyRevenue = useMemo(() =>
    appointments
      .filter(app => app.status === 'concluido' && isThisMonth(parseISO(app.data_inicio)))
      .reduce((acc, app) => acc + (app.servico?.preco || 0), 0),
    [appointments]
  );

  const statusCounts = useMemo(() => {
    const counts = {
      pendente: 0,
      confirmado: 0,
      em_andamento: 0,
      concluido: 0,
      cancelado: 0,
      nao_compareceu: 0,
    };
    appointments.forEach(app => {
      if (counts.hasOwnProperty(app.status)) {
        counts[app.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [appointments]);

  const todayCount = useMemo(() =>
    appointments.filter(app => isSameDay(parseISO(app.data_inicio), today)).length,
    [appointments]
  );



  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Olá, {user?.nome?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Agendamentos Hoje"
            value={todayCount}
            icon={Calendar}
            loading={isLoading}
          />
          <MetricCard
            title="Confirmações Pendentes"
            value={pendingConfirmations}
            icon={Clock}
            loading={isLoading}
          />
          <MetricCard
            title="Total de Clientes"
            value={clients.length}
            icon={Users}
            loading={isLoading}
          />
          <MetricCard
            title="Receita Mensal"
            value={formatCurrency(monthlyRevenue)}
            icon={DollarSign}
            loading={isLoading}
          />
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-card border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 mb-2">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.pendente}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pendentes</p>
          </div>
          <div className="bg-card border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.confirmado}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Confirmados</p>
          </div>
          <div className="bg-card border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-2">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.em_andamento}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Em Curso</p>
          </div>
          <div className="bg-card border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.concluido}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Concluídos</p>
          </div>
          <div className="bg-card border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-2">
              <XCircle className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.cancelado}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cancelados</p>
          </div>
          <div className="bg-card border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-8 w-8 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-600 mb-2">
              <User className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.nao_compareceu}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Faltas</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-3">
              <QuickAction
                icon={Calendar}
                label="Novo Agendamento"
                href="/admin/appointments?action=new"
              />
              <QuickAction
                icon={Scissors}
                label="Adicionar Serviço"
                href="/admin/services?action=new"
              />
              <QuickAction
                icon={UserPlus}
                label="Adicionar Profissional"
                href="/admin/professionals?action=new"
              />
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
              <Link to="/admin/appointments">
                <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)
              ) : nextAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum agendamento futuro</p>
                </div>
              ) : (
                nextAppointments.slice(0, 3).map((apt) => (
                  <AppointmentItem
                    key={apt.id}
                    time={format(parseISO(apt.data_inicio), 'HH:mm')}
                    date={isSameDay(parseISO(apt.data_inicio), today) ? 'Hoje' : format(parseISO(apt.data_inicio), 'dd/MM')}
                    clientName={apt.cliente?.nome || 'Cliente'}
                    serviceName={apt.servico?.nome || 'Serviço'}
                    professionalName={apt.professional?.nome || 'Profissional'}
                    status={apt.status}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Overview Stats */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">Serviços Ativos</p>
                    <p className="text-xs text-muted-foreground truncate">Disponíveis para agendamento</p>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold shrink-0">
                  {services.filter((s) => s.ativo).length}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">Profissionais Ativos</p>
                    <p className="text-xs text-muted-foreground truncate">Disponíveis para atendimento</p>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold shrink-0">
                  {professionals.filter((p) => p.ativo).length}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">Agendamentos Pendentes</p>
                    <p className="text-xs text-muted-foreground truncate">Aguardando confirmação</p>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold shrink-0">
                  {appointments.filter((a) => a.status === 'pendente').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
