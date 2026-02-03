import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, X, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getEmpresasPublicas, getCategoriasEmpresa } from '@/lib/supabase-services';
import { LikeButton } from '@/components/LikeButton';
import { BUSINESS_CATEGORIES } from '@/lib/constants';

// Helper to safely parse categories (handles legacy strings and double-encoded JSON)
const parseCategories = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 1 && typeof raw[0] === 'string' && raw[0].startsWith('[')) {
      try {
        const parsed = JSON.parse(raw[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return raw;
  }
  if (typeof raw === 'string' && raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* ignore */ }
  }
  return [raw];
};

// Header Component
function ClientHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/book" className="flex items-center gap-3 shrink-0">
            <div className="h-11 w-11 rounded-xl overflow-hidden flex items-center justify-center shadow-soft">
              <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold leading-tight">PrimeBooking</span>
              <span className="text-[10px] font-medium text-muted-foreground leading-none">Agendamento Inteligente</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="mr-2 hidden md:block">
              <LikeButton />
            </div>
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// Business Card Component
function BusinessCard({ business }: { business: any }) {

  const businessImage = business.imagem_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';

  return (
    <Link to={`/book/${business.slug}`}>
      <Card className="overflow-hidden hover:shadow-soft transition-all group cursor-pointer h-full border-muted/50">
        <div className="aspect-[16/10] relative overflow-hidden">
          <img
            src={businessImage}
            alt={business.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end">
            {parseCategories(business.categoria).map((cat: string) => (
              <Badge key={cat} className="bg-background/90 text-foreground hover:bg-background/90 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                {cat}
              </Badge>
            ))}
            {parseCategories(business.categoria).length === 0 && (
              <Badge className="bg-background/90 text-foreground hover:bg-background/90 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                Serviços
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 flex flex-col h-[calc(100%-160px)] min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors flex-1 min-w-0">
              {business.nome}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1 mr-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-medium text-sm">{Number(business.rating || 0).toFixed(1)}</span>
                <span className="text-muted-foreground text-xs">({business.avaliacoes || '0'})</span>
              </div>
              <div className="h-3 w-px bg-border mx-1" />
              <LikeButton targetId={business.id} compact />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/book/${business.slug}`;
                  if (navigator.share) {
                    navigator.share({
                      title: business.nome,
                      text: business.descricao,
                      url: shareUrl
                    }).catch(() => {
                      navigator.clipboard.writeText(shareUrl);
                    });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {business.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3 italic leading-snug">
              {business.descricao}
            </p>
          )}
          <div className="flex items-start gap-1 text-[11px] text-muted-foreground mb-4 min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="truncate flex-1">
              {[business.cidade, business.estado].filter(Boolean).join(', ') || 'Endereço não informado'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Category Filter deleted - now using DB

export default function ClientExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['public-businesses'],
    queryFn: getEmpresasPublicas
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['global-categories'],
    queryFn: getCategoriasEmpresa
  });

  const categories = ['Todos', ...dbCategories.filter(c => c.ativo).map(c => c.nome)];

  // Filter businesses
  const filteredBusinesses = (businesses || []).filter((business: any) => {
    const cats = parseCategories(business.categoria);
    const matchesSearch =
      business.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cats.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (business.descricao || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (business.cidade || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todos' ||
      cats.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientHeader />

      <main className="container max-w-6xl mx-auto px-4 py-8 flex-1">
        {/* Hero Section */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Encontre e agende<br /> serviços incríveis
          </h1>
          <p className="text-muted-foreground text-lg">
            Salões, barbearias, spas e muito mais perto de você.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar serviços, salões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-16 text-lg rounded-2xl shadow-sm border-muted transition-all focus:ring-4 focus:ring-primary/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-3 overflow-x-auto py-4 px-2 -mx-2 -my-2 mb-8 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-6 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all border-2',
                selectedCategory === category
                  ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                  : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Resultados
            <span className="bg-primary/10 text-primary text-sm px-2.5 py-0.5 rounded-full">
              {filteredBusinesses.length}
            </span>
          </h2>
        </div>

        {/* Business Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[16/14] rounded-2xl bg-muted animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-muted rounded-3xl bg-muted/5">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Tente ajustar sua busca ou filtros para encontrar o que procura.</p>
            <Button size="lg" variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }} className="rounded-xl px-8">
              Ver todos os estabelecimentos
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBusinesses.map((business: any) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-12 bg-muted/20">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-soft">
              <img src="/favicon.png" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-lg">PrimeBooking</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} PrimeBooking. A plataforma definitiva para agendamentos online.
          </p>
        </div>
      </footer>
    </div>
  );
}
