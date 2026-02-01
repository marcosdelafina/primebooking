import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">PrimeBooking</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Agende seus<br />
              <span className="text-primary">compromissos</span><br />
              com facilidade
            </h1>
            <p className="text-lg text-muted-foreground">
              A plataforma mais simples para gerenciar agendamentos, clientes e profissionais.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card shadow-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Agendamentos</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card shadow-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Clientes</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card shadow-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Horários</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              onClick={() => navigate('/signup')}
            >
              Criar conta grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg font-semibold"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
          </div>

          {/* Demo hint */}
          <p className="text-sm text-muted-foreground pt-4">
            Demo: <code className="bg-muted px-2 py-1 rounded text-xs">demo@primebooking.com</code> / <code className="bg-muted px-2 py-1 rounded text-xs">demo123</code>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 PrimeBooking. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
