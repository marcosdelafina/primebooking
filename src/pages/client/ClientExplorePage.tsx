import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { mockBusinesses, type Business } from '@/lib/booking-data';
import { cn } from '@/lib/utils';

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
function BusinessCard({ business }: { business: Business }) {
  const formatPrice = (services: Business['servicos']) => {
    const minPrice = Math.min(...services.map(s => s.preco));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(minPrice);
  };

  return (
    <Link to={`/book/${business.slug}`}>
      <Card className="overflow-hidden hover:shadow-soft transition-all group cursor-pointer">
        <div className="aspect-[16/10] relative overflow-hidden">
          <img
            src={business.imagem_url}
            alt={business.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-3 right-3 bg-background/90 text-foreground hover:bg-background/90">
            {business.categoria}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {business.nome}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{business.rating}</span>
              <span className="text-muted-foreground text-sm">({business.avaliacoes})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{business.endereco}, {business.cidade}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              A partir de <span className="font-semibold text-foreground">{formatPrice(business.servicos)}</span>
            </span>
            <Button size="sm" variant="secondary">
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

  // Filter businesses
  const filteredBusinesses = mockBusinesses.filter((business) => {
    const matchesSearch = 
      business.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'Todos' || business.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      <main className="container max-w-6xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Encontre e agende<br className="sm:hidden" /> serviços incríveis
          </h1>
          <p className="text-muted-foreground text-lg">
            Salões, barbearias, spas e muito mais perto de você.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar serviços, salões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {filteredBusinesses.length} estabelecimento{filteredBusinesses.length !== 1 ? 's' : ''} encontrado{filteredBusinesses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Business Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground mb-4">Tente ajustar sua busca ou filtros.</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container max-w-6xl mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2024 PrimeBooking. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
