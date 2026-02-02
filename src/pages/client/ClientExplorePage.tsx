import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getEmpresasPublicas } from '@/lib/supabase-services';

// Header Component
function ClientHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/book" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold hidden sm:block">PrimeBooking</span>
          </Link>
          <div className="flex items-center gap-3">
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
  const formatPrice = (servicos: any[]) => {
    if (!servicos || servicos.length === 0) return 'Sob consulta';
    const prices = servicos.map(s => s.preco).filter(p => p != null && p > 0);
    if (prices.length === 0) return 'Sob consulta';

    const minPrice = Math.min(...prices);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(minPrice);
  };

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
          <Badge className="absolute top-3 right-3 bg-background/90 text-foreground hover:bg-background/90 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
            {business.categoria || 'Serviços'}
          </Badge>
        </div>
        <CardContent className="p-4 flex flex-col h-[calc(100%-160px)]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {business.nome}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{business.rating || '5.0'}</span>
              <span className="text-muted-foreground text-sm">({business.avaliacoes || '0'})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{business.endereco || 'Endereço não informado'}{business.cidade ? `, ${business.cidade}` : ''}</span>
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">A partir de</span>
              <span className="font-bold text-lg text-primary">{formatPrice(business.servicos)}</span>
            </div>
            <Button size="sm" variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              Ver mais
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Category Filter
const categories = ['Todos', 'Salão de Beleza', 'Barbearia', 'Spa & Bem-estar', 'Estética'];

export default function ClientExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['public-businesses'],
    queryFn: getEmpresasPublicas
  });

  // Filter businesses
  const filteredBusinesses = (businesses || []).filter((business: any) => {
    const matchesSearch =
      business.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (business.categoria || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (business.descricao || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todos' || business.categoria === selectedCategory;

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
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-bold">PrimeBooking</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 PrimeBooking. A plataforma definitiva para agendamentos online.
          </p>
        </div>
      </footer>
    </div>
  );
}
