import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Star, Quote } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { getPublicReviews } from '@/lib/supabase-services';
import { cn } from '@/lib/utils';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden flex items-center justify-center shadow-soft">
            <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground leading-tight">PrimeBooking</span>
            <span className="text-[10px] font-medium text-muted-foreground leading-none">Agendamento Inteligente</span>
          </div>
        </div>
        <ThemeToggle />
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
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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


          {/* Testimonials Section */}
          <PublicReviewsSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} PrimeBooking. A plataforma definitiva para agendamentos online.
        </p>
      </footer>
    </div>
  );
}

function PublicReviewsSection() {
  const { data: reviews = [] } = useQuery({
    queryKey: ['public-reviews'],
    queryFn: () => getPublicReviews(),
  });

  if (reviews.length === 0) return null;

  const averageRating = reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length;

  return (
    <div className="pt-12 space-y-8 animate-fade-in">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "h-5 w-5",
                s <= Math.round(averageRating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
              )}
            />
          ))}
          <span className="text-sm font-bold ml-2">{averageRating.toFixed(1)}</span>
        </div>
        <h2 className="text-2xl font-bold">O que dizem sobre nós</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {reviews.slice(0, 4).map((review) => (
          <div key={review.id} className="p-6 rounded-2xl bg-card border border-primary/10 shadow-soft relative overflow-hidden group hover:border-primary/30 transition-colors">
            <Quote className="absolute -right-2 -top-2 h-12 w-12 text-primary/5 rotate-12 transition-transform group-hover:scale-110" />
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-3 w-3",
                    s <= review.nota ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-foreground mb-4 italic line-clamp-3">
              "{review.comentario}"
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                {(review.empresa as any)?.nome?.charAt(0) || '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{(review.empresa as any)?.nome}</span>
                <span className="text-[10px] text-muted-foreground">Cliente PrimeBooking</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
