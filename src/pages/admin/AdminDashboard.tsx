import { 
  Calendar, 
  Users, 
  Clock, 
  DollarSign,
  Plus,
  Scissors,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/layouts/AdminLayout';
import { mockDashboardMetrics, mockAgendamentos, mockClientes, mockProfissionais, mockServicos } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

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
        <CardContent className="p-6">
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
      <CardContent className="p-6">
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
        className="h-auto flex-col gap-2 py-4 px-6 hover:bg-primary hover:text-primary-foreground transition-colors"
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
  clientName,
  serviceName,
  professionalName,
  status,
}: {
  time: string;
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
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-card transition-shadow">
      <div className="text-center min-w-[60px]">
        <p className="text-lg font-bold text-primary">{time}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{clientName}</p>
        <p className="text-sm text-muted-foreground truncate">
          {serviceName} • {professionalName}
        </p>
      </div>
      <Badge variant="outline" className={cn('shrink-0', statusColors[status])}>
        {statusLabels[status] || status}
      </Badge>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Get today's appointments (mocked)
  const todayAppointments = mockAgendamentos.slice(0, 3);

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
            value={mockDashboardMetrics.todayAppointments}
            icon={Calendar}
            trend={mockDashboardMetrics.appointmentsGrowth}
            trendLabel="vs semana passada"
          />
          <MetricCard
            title="Confirmações Pendentes"
            value={mockDashboardMetrics.pendingConfirmations}
            icon={Clock}
          />
          <MetricCard
            title="Total de Clientes"
            value={mockDashboardMetrics.totalClients}
            icon={Users}
          />
          <MetricCard
            title="Receita Mensal"
            value={formatCurrency(mockDashboardMetrics.monthlyRevenue)}
            icon={DollarSign}
            trend={mockDashboardMetrics.revenueGrowth}
            trendLabel="vs mês passado"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <QuickAction
                icon={Plus}
                label="Novo Agendamento"
                href="/admin/appointments/new"
              />
              <QuickAction
                icon={Scissors}
                label="Adicionar Serviço"
                href="/admin/services/new"
              />
              <QuickAction
                icon={UserPlus}
                label="Adicionar Profissional"
                href="/admin/professionals/new"
              />
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Agenda de Hoje</CardTitle>
              <Link to="/admin/appointments">
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link to="/admin/appointments/new">Criar agendamento</Link>
                  </Button>
                </div>
              ) : (
                todayAppointments.map((apt) => {
                  const cliente = mockClientes.find((c) => c.id === apt.cliente_id);
                  const servico = mockServicos.find((s) => s.id === apt.servico_id);
                  const profissional = mockProfissionais.find((p) => p.id === apt.profissional_id);
                  return (
                    <AppointmentItem
                      key={apt.id}
                      time={new Date(apt.data_inicio).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      clientName={cliente?.nome || 'Cliente'}
                      serviceName={servico?.nome || 'Serviço'}
                      professionalName={profissional?.nome || 'Profissional'}
                      status={apt.status}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Serviços Ativos</p>
                    <p className="text-sm text-muted-foreground">Disponíveis para agendamento</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {mockServicos.filter((s) => s.ativo).length}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Profissionais Ativos</p>
                    <p className="text-sm text-muted-foreground">Disponíveis para atendimento</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {mockProfissionais.filter((p) => p.ativo).length}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Agendamentos Pendentes</p>
                    <p className="text-sm text-muted-foreground">Aguardando confirmação</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {mockAgendamentos.filter((a) => a.status === 'pendente').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
