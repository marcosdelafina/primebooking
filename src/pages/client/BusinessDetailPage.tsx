import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Share2,
  Heart,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateTimeSlots, getNext7Days } from '@/lib/booking-data';
import type { Servico } from '@/types/entities';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getEmpresaBySlug, getServicos } from '@/lib/supabase-services';

// Format helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${mins}min`;
};

const formatDateFull = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

// Day Names
const getDayName = (date: Date) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[date.getDay()];
};

export default function BusinessDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 1. Fetch Business by Slug
  const { data: business, isLoading: isBizLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => slug ? getEmpresaBySlug(slug) : null,
    enabled: !!slug
  });

  // 2. Fetch Services once we have business ID
  const { data: services = [], isLoading: isSvcLoading } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: () => getServicos(business.id),
    enabled: !!business?.id
  });

  const isLoading = isBizLoading || isSvcLoading;

  // Booking state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(getNext7Days()[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Available dates
  const availableDates = getNext7Days();

  // Time slots for selected date
  const timeSlots = useMemo(() => {
    if (!business) return [];
    const startHour = parseInt((business.horario_abertura || '09:00').split(':')[0]);
    const endHour = parseInt((business.horario_fechamento || '18:00').split(':')[0]);
    return generateTimeSlots(selectedDate, startHour, endHour);
  }, [selectedDate, business]);

  // Grouped services by category
  const groupedServices = useMemo(() => {
    if (!business || !services) return {};
    return services.reduce((acc: Record<string, Servico[]>, service: Servico) => {
      const category = service.categoria || 'Outros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});
  }, [business, services]);

  // Categories
  const categories = Object.keys(groupedServices);

  // Selected tab
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

  // Total price and duration
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.preco, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duracao_min, 0);

  // Handlers
  const toggleService = (service: Servico) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleStartBooking = () => {
    setIsBookingOpen(true);
    setBookingStep(1);
    setSelectedServices([]);
    setSelectedTime(null);
  };

  const handleContinue = () => {
    if (bookingStep === 1 && selectedServices.length > 0) {
      setBookingStep(2);
    } else if (bookingStep === 2 && selectedTime) {
      setBookingStep(3);
    }
  };

  const handleBack = () => {
    if (bookingStep === 2) setBookingStep(1);
    else if (bookingStep === 3) setBookingStep(2);
  };

  const handleConfirmBooking = () => {
    toast({
      title: 'Agendamento confirmado! 🎉',
      description: `Seu horário está reservado para ${formatDateFull(selectedDate)} às ${selectedTime}.`,
    });
    setIsBookingOpen(false);
    setBookingStep(1);
    setSelectedServices([]);
    setSelectedTime(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-soft text-primary font-medium text-lg">Carregando estabelecimento...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold mb-4">Estabelecimento não encontrado</h1>
          <p className="text-muted-foreground mb-6">Verifique se o link está correto ou tente novamente mais tarde.</p>
          <Button onClick={() => navigate('/book')}>Explorar outros estabelecimentos</Button>
        </div>
      </div>
    );
  }

  // Fallback for missing fields if real DB doesn't have them yet
  const businessImage = business.imagem_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
  const businessGallery = business.galeria?.length > 0 ? business.galeria : [businessImage];
  const openingTime = business.horario_abertura || '09:00';
  const closingTime = business.horario_fechamento || '18:00';
  const openDays = business.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const rating = business.rating || 5.0;
  const reviewsCount = business.avaliacoes || 0;
  const bio = business.descricao || 'Seja bem-vindo ao nosso estabelecimento. Agende seu horário com os melhores profissionais.';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/book')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-2 mb-6 rounded-xl overflow-hidden">
          <div className="col-span-4 md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto">
            <img
              src={businessGallery[0]}
              alt={business.nome}
              className="w-full h-full object-cover"
            />
          </div>
          {businessGallery.slice(1, 5).map((img: string, i: number) => (
            <div key={i} className="hidden md:block aspect-[4/3]">
              <img
                src={img}
                alt={`${business.nome} ${i + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Business Info */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Rating */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <Badge variant="secondary" className="mb-2">{business.categoria}</Badge>
                  <h1 className="text-2xl md:text-3xl font-bold">{business.nome}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-warning text-warning" />
                  <span className="font-semibold">{rating}</span>
                  <span className="text-muted-foreground">({reviewsCount} avaliações)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{business.endereco || 'Endereço não informado'}{business.cidade ? `, ${business.cidade}` : ''}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground">{bio}</p>

            {/* Services */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Serviços</h2>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
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

              {/* Services List */}
              <div className="space-y-3">
                {groupedServices[selectedCategory]?.map((service) => (
                  <Card key={service.id} className="hover:shadow-soft transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{service.nome}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.descricao}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 inline mr-1" />
                            {formatDuration(service.duracao_min)}
                          </span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(service.preco)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedServices([service]);
                          setIsBookingOpen(true);
                          setBookingStep(2);
                        }}
                      >
                        Agendar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                {/* Hours */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário de funcionamento
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {openingTime} - {closingTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {openDays.map((d: string) => {
                      const labels: Record<string, string> = {
                        seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom'
                      };
                      return labels[d];
                    }).join(', ')}
                  </p>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contato
                  </h3>
                  <p className="text-sm text-muted-foreground">{business.telefone}</p>
                </div>

                {/* Book Button */}
                <Button className="w-full h-12 text-base" onClick={handleStartBooking}>
                  <Calendar className="h-5 w-5 mr-2" />
                  Agendar agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {bookingStep > 1 && (
                  <button onClick={handleBack} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Passo {bookingStep} de 3</p>
                  <DialogTitle>
                    {bookingStep === 1 && 'Selecionar serviços'}
                    {bookingStep === 2 && 'Selecionar horário'}
                    {bookingStep === 3 && 'Confirmar agendamento'}
                  </DialogTitle>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex">
            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Select Services */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  {/* Category Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                          selectedCategory === category
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    {groupedServices[selectedCategory]?.map((service) => {
                      const isSelected = selectedServices.some((s) => s.id === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service)}
                          className={cn(
                            'w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className={cn(
                            'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          )}>
                            {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{service.nome}</span>
                              <span className="font-semibold text-primary shrink-0">
                                {formatCurrency(service.preco)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDuration(service.duracao_min)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Select Time */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  {/* Date Picker */}
                  <div>
                    <h3 className="font-medium mb-3">Selecione a data</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {availableDates.map((date) => {
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedTime(null);
                            }}
                            className={cn(
                              'flex flex-col items-center px-4 py-3 rounded-xl border min-w-[70px] transition-all',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <span className="text-xs font-medium uppercase">
                              {getDayName(date)}
                            </span>
                            <span className="text-xl font-bold">{date.getDate()}</span>
                            {isToday && (
                              <span className={cn(
                                'text-xs',
                                isSelected ? 'text-primary-foreground/80' : 'text-primary'
                              )}>Hoje</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h3 className="font-medium mb-3">Horários disponíveis</h3>
                    {timeSlots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum horário disponível para esta data.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              'py-3 rounded-lg border text-sm font-medium transition-all',
                              selectedTime === time
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {bookingStep === 3 && (
                <div className="space-y-6">
                  {/* Business Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <img
                      src={businessImage}
                      alt={business.nome}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{business.nome}</h3>
                      <p className="text-sm text-muted-foreground">{business.endereco || 'A definir'}</p>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Serviços selecionados</h3>
                      <div className="space-y-2">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex items-center justify-between py-2 border-b">
                            <div>
                              <p className="font-medium">{service.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDuration(service.duracao_min)}
                              </p>
                            </div>
                            <span className="font-medium">{formatCurrency(service.preco)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Data e horário</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateFull(selectedDate)} às {selectedTime}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-lg">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-primary">{formatCurrency(totalPrice)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Duração total: {formatDuration(totalDuration)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Sidebar (desktop) */}
            {selectedServices.length > 0 && bookingStep !== 3 && (
              <div className="hidden lg:block w-72 border-l p-6 bg-muted/30">
                <h3 className="font-semibold mb-4">{business.nome}</h3>
                <div className="space-y-3 mb-4">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{service.nome}</p>
                        <p className="text-muted-foreground">{formatDuration(service.duracao_min)}</p>
                      </div>
                      <span>{formatCurrency(service.preco)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t shrink-0 bg-background">
            {bookingStep === 3 ? (
              <Button className="w-full h-12" onClick={handleConfirmBooking}>
                Confirmar agendamento
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="sm:hidden">
                  {selectedServices.length > 0 && (
                    <p className="text-sm">
                      <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                      <span className="text-muted-foreground"> • {selectedServices.length} serviço(s)</span>
                    </p>
                  )}
                </div>
                <Button
                  className="flex-1 sm:flex-none sm:min-w-[160px] h-12 ml-auto"
                  disabled={
                    (bookingStep === 1 && selectedServices.length === 0) ||
                    (bookingStep === 2 && !selectedTime)
                  }
                  onClick={handleContinue}
                >
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
