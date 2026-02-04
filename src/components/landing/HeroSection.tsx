import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container relative py-20 md:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Content */}
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 w-fit rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Plataforma SaaS de Agendamentos
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Agendamentos{" "}
              <span className="text-gradient">simples, automáticos</span>{" "}
              e profissionais
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Centralize seus agendamentos, confirme clientes automaticamente e aumente sua taxa de comparecimento.
              Tudo em uma plataforma fácil de usar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button size="lg" className="shadow-elegant group" onClick={() => navigate("/signup")}>
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="group" onClick={() => navigate("/signup")}>
                <Play className="mr-2 h-4 w-4" />
                Testar gratuitamente
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Sem cartão de crédito
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Configuração em 5 minutos
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Suporte humanizado
              </div>
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="relative lg:pl-8 animate-fade-in-up">
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-2 shadow-2xl">
              {/* Mock Dashboard */}
              <div className="rounded-xl bg-card border overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                    <div className="h-3 w-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="h-5 w-48 rounded bg-muted" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-foreground">12</p>
                      <p className="text-xs text-muted-foreground">Hoje</p>
                    </div>
                    <div className="rounded-lg bg-accent p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-foreground">98%</p>
                      <p className="text-xs text-muted-foreground">Confirmados</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-foreground">324</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                  </div>

                  {/* Appointments list mock */}
                  <div className="space-y-2">
                    {[
                      { time: "09:00", name: "Maria Silva", service: "Corte + Escova" },
                      { time: "10:30", name: "João Santos", service: "Barba" },
                      { time: "14:00", name: "Ana Costa", service: "Coloração" },
                    ].map((apt, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-lg border bg-background p-3">
                        <div className="flex h-10 w-10 overflow-hidden rounded-full shadow-sm bg-primary/5">
                          <img src="/logo-p.png" alt="PrimeBooking" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{apt.name}</p>
                          <p className="text-xs text-muted-foreground">{apt.service}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -left-4 top-1/4 animate-float">
              <div className="rounded-xl bg-card border p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Agendamento confirmado!</p>
                    <p className="text-xs text-muted-foreground">há 2 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
