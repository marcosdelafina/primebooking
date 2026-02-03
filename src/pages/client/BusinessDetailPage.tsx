import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Share2,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Map,
  Navigation,
  ChevronsUpDown,
  User2,
  Loader2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getEmpresaBySlug, getServicos, getProfissionais, createAgendamento, getClienteByTelefone, createCliente, getBusinessReviews, submitBusinessReview } from '@/lib/supabase-services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { generateTimeSlots, getNext7Days } from '@/lib/booking-data';
import type { Servico } from '@/types/entities';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LikeButton } from '@/components/LikeButton';

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

const formatPhoneHelper = (value: string) => {
  const digits = value.replace(/\D/g, '');
  // Brazilian digits: 55 (country) + 2 (DDD) + 9 (Mobile) = 13 digits total
  // We keep +55 always
  const phone = digits.startsWith('55') ? digits.slice(2) : digits;

  if (phone.length === 0) return '+55 ';
  if (phone.length <= 2) return `+55 (${phone}`;
  if (phone.length <= 7) return `+55 (${phone.slice(0, 2)}) ${phone.slice(2)}`;
  return `+55 (${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
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

  // 3. Fetch Professionals
  const { data: professionals = [], isLoading: isProLoading } = useQuery({
    queryKey: ['professionals', business?.id],
    queryFn: () => getProfissionais(business.id),
    enabled: !!business?.id
  });

  // 4. Fetch Reviews
  const { data: bReviews = [], isLoading: isRevLoading } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: () => getBusinessReviews(business.id),
    enabled: !!business?.id
  });

  const isLoading = isBizLoading || isSvcLoading || isProLoading || isRevLoading;
  const billingInfo = Array.isArray(business?.billing) ? business?.billing[0] : business?.billing;
  const isSuspended = billingInfo?.billing_status === 'SUSPENSA';

  // Booking state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Client info state
  const [clientInfo, setClientInfo] = useState({
    nome: '',
    telefone: '+55 ',
    email: '',
  });

  // Review state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: (data: { nota: number; comentario: string; nome: string }) =>
      submitBusinessReview({
        empresa_id: business?.id || '',
        cliente_nome: data.nome,
        nota: data.nota,
        comentario: data.comentario
      }),
    onSuccess: () => {
      toast({
        title: 'Avaliação enviada! ⭐',
        description: 'Sua avaliação foi enviada para aprovação do estabelecimento.',
      });
      setReviewSubmitted(true);
      setIsReviewOpen(false);
      setReviewRating(0);
      setReviewComment('');
      setReviewName('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar avaliação',
        description: error.message || 'Ocorreu um erro ao processar sua avaliação.',
        variant: 'destructive',
      });
    }
  });

  // Available dates
  const availableDates = useMemo(() => {
    return getNext7Days(business?.dias_funcionamento);
  }, [business?.dias_funcionamento]);

  // Set initial selected date when available dates load
  useEffect(() => {
    if (availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  // Time slots for selected date
  const timeSlots = useMemo(() => {
    if (!business) return [];

    // 1. Get base establishment hours
    const baseSlots = generateTimeSlots(
      selectedDate,
      business.horario_abertura || '09:00',
      business.horario_fechamento || '18:00'
    );

    // 2. Filter by professional availability if selected
    if (selectedProfessionalId !== 'any') {
      const professional = professionals.find(p => p.id === selectedProfessionalId);
      if (professional && professional.disponibilidade) {
        const dayLabels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const dayLabel = dayLabels[selectedDate.getDay()];
        const proAvailability = professional.disponibilidade[dayLabel] || [];

        return baseSlots.filter(slot => {
          // Check if slot falls within any professional availability range
          return proAvailability.some(av => {
            if (!av.ativo) return false;
            return slot >= av.inicio && slot < av.fim;
          });
        });
      }
    }

    return baseSlots;
  }, [selectedDate, business, selectedProfessionalId, professionals]);

  // Grouped services by category
  const groupedServices = useMemo(() => {
    if (!business || !services) return {};
    return services
      .filter(s => s.ativo)
      .reduce((acc: Record<string, Servico[]>, service: Servico) => {
        const category = service.categoria || 'Serviços';
        if (!acc[category]) acc[category] = [];
        acc[category].push(service);
        return acc;
      }, {});
  }, [business, services]);

  // Categories
  const categories = Object.keys(groupedServices);

  // Selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Auto-select first category when they load
  useEffect(() => {
    if (categories.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories([categories[0]]);
    }
  }, [categories, selectedCategories]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleService = (service: Servico) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  // Total price and duration
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.preco, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duracao_min, 0);

  const queryClient = useQueryClient();
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!business || !selectedTime) throw new Error('Missing data');

      // 1. Get or Create Client
      let client = await getClienteByTelefone(business.id, clientInfo.telefone);
      if (!client) {
        client = await createCliente(business.id, {
          nome: clientInfo.nome,
          telefone: clientInfo.telefone,
          email: clientInfo.email
        });
      } else if (clientInfo.email && !client.email) {
        // Update email if it was previously empty
        await updateCliente(client.id, { email: clientInfo.email });
      }

      // 2. Create Agendamento
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + totalDuration);

      return createAgendamento(business.id, {
        cliente_id: client.id,
        profissional_id: selectedProfessionalId === 'any' ? undefined : selectedProfessionalId,
        servico_id: selectedServices[0].id,
        servicos_ids: selectedServices.map(s => s.id),
        data_inicio: startDateTime.toISOString(),
        data_fim: endDateTime.toISOString(),
        status: 'pendente'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Agendamento solicitado! 🎉',
        description: `Seu horário para ${formatDateFull(selectedDate)} às ${selectedTime} foi enviado para aprovação.`,
      });
      setIsBookingOpen(false);
      resetBooking();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao agendar',
        description: error.message || 'Ocorreu um erro ao processar seu agendamento.',
        variant: 'destructive',
      });
    }
  });

  // Auto-fetch client name by phone
  useEffect(() => {
    const fetchClientName = async () => {
      const cleanPhone = clientInfo.telefone.replace(/\D/g, '');
      // +55 plus at least 10 digits (e.g., +55 11 99999999)
      if (cleanPhone.length >= 12 && business?.id) {
        try {
          const client = await getClienteByTelefone(business.id, clientInfo.telefone.trim());
          if (client && client.nome && !clientInfo.nome) {
            setClientInfo(prev => ({ ...prev, nome: client.nome, email: client.email || prev.email }));
          }
        } catch (error) {
          console.error('Error fetching client:', error);
        }
      }
    };

    const timer = setTimeout(fetchClientName, 500);
    return () => clearTimeout(timer);
  }, [clientInfo.telefone, business?.id]);

  const resetBooking = () => {
    setBookingStep(1);
    setSelectedServices([]);
    setSelectedTime(null);
    setSelectedProfessionalId('any');
    setClientInfo({ nome: '', telefone: '+55 ', email: '' });
  };

  const handleStartBooking = () => {
    setIsBookingOpen(true);
    setBookingStep(selectedServices.length > 0 ? 2 : 1);
  };

  const handleContinue = () => {
    if (bookingStep === 1 && selectedServices.length > 0) {
      setBookingStep(2);
    } else if (bookingStep === 2 && selectedTime) {
      setBookingStep(3);
    } else if (bookingStep === 3) {
      if (!clientInfo.nome || !clientInfo.telefone) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha seu nome e telefone.',
          variant: 'destructive'
        });
        return;
      }

      const cleanPhone = clientInfo.telefone.replace(/\D/g, '');
      // 55 (country) + 11 (DDD + Mobile) = 13 total digits
      if (cleanPhone.length < 13) {
        toast({
          title: 'Telefone inválido',
          description: 'Por favor, informe o DDD e o número completo com 9 dígitos.',
          variant: 'destructive'
        });
        return;
      }

      setBookingStep(4);
    }
  };

  const handleBack = () => {
    if (bookingStep === 2) setBookingStep(1);
    else if (bookingStep === 3) setBookingStep(2);
    else if (bookingStep === 4) setBookingStep(3);
  };

  const handleConfirmBooking = () => {
    bookingMutation.mutate();
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
  const rating = Number(business.rating || 0).toFixed(1);
  const reviewsCount = business.avaliacoes || 0;
  const bio = business.descricao || 'Seja bem-vindo ao nosso estabelecimento. Agende seu horário com os melhores profissionais.';

  const fullAddress = [
    business.logradouro,
    business.numero && `nº ${business.numero}`,
    business.bairro,
    business.cidade,
    business.estado
  ].filter(Boolean).join(', ');

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;
  const whatsappLink = business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}` : null;

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
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: business.nome,
                      text: business.descricao,
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Share2 className="h-5 w-5" />
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(() => {
                      const raw = business.categoria;
                      let categories: string[] = [];
                      if (Array.isArray(raw)) {
                        if (raw.length === 1 && typeof raw[0] === 'string' && raw[0].startsWith('[')) {
                          try {
                            const parsed = JSON.parse(raw[0]);
                            if (Array.isArray(parsed)) categories = parsed;
                            else categories = raw;
                          } catch (e) { categories = raw; }
                        } else {
                          categories = raw;
                        }
                      } else if (typeof raw === 'string' && raw.startsWith('[')) {
                        try {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed)) categories = parsed;
                          else categories = [raw];
                        } catch (e) { categories = [raw]; }
                      } else if (raw) {
                        categories = [raw];
                      }

                      return categories.map((cat: string) => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ));
                    })()}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">{business.nome}</h1>
                  <p className="text-muted-foreground mt-2">{bio}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsReviewOpen(true)}
                    className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded-lg transition-colors group"
                  >
                    <Star className="h-5 w-5 fill-warning text-warning group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">{rating}</span>
                    <span className="text-muted-foreground">({reviewsCount} avaliações)</span>
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <LikeButton targetId={business.id} />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{fullAddress || 'Endereço não informado'}</span>
                  </div>
                  {fullAddress && (
                    <div className="flex items-center gap-2 ml-1">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-blue-100/50 text-blue-600 hover:bg-blue-100 transition-all"
                        title="Ver no Google Maps"
                      >
                        <Map className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-cyan-100/50 text-cyan-600 hover:bg-cyan-100 transition-all"
                        title="Ver no Waze"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Services */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Serviços</h2>

              {/* Category Selector - Only show if more than one category exists */}
              {categories.length > 1 && (
                <div className="mb-6">
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal h-12 text-base md:w-[300px]"
                        onClick={() => setPopoverOpen(true)}
                      >
                        <div className="flex gap-1 truncate">
                          {selectedCategories.length === 0 ? (
                            "Selecione as categorias"
                          ) : selectedCategories.length === categories.length ? (
                            "Todas as categorias"
                          ) : (
                            selectedCategories.join(", ")
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar categoria..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setSelectedCategories(prev =>
                                  prev.length === categories.length ? [] : [...categories]
                                );
                              }}
                              className="flex items-center gap-2 font-medium"
                            >
                              <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
                                selectedCategories.length === categories.length
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              )}>
                                {selectedCategories.length === categories.length && <Check className="h-3 w-3" />}
                              </div>
                              <span>Selecionar Todas</span>
                            </CommandItem>
                            {categories.map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => {
                                  toggleCategory(category);
                                }}
                                className="flex items-center gap-2"
                              >
                                <div className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
                                  selectedCategories.includes(category)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50"
                                )}>
                                  {selectedCategories.includes(category) && <Check className="h-3 w-3" />}
                                </div>
                                <span>{category}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Services List */}
              <div className="space-y-8">
                {selectedCategories.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl border-muted">
                    <p className="text-muted-foreground">Selecione uma categoria para ver os serviços.</p>
                  </div>
                ) : (
                  [...selectedCategories]
                    .sort((a, b) => categories.indexOf(a) - categories.indexOf(b))
                    .map((category) => (
                      <div key={category} className="space-y-4">
                        {category !== 'Serviços' && (
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {category}
                          </h3>
                        )}
                        <div className="space-y-3">
                          {groupedServices[category]?.map((service) => (
                            <Card key={service.id} className="hover:shadow-soft transition-shadow group">
                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{service.nome}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                    {service.descricao}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatDuration(service.duracao_min)}
                                    </span>
                                    <span className="font-bold text-primary text-base">
                                      {formatCurrency(service.preco)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant={selectedServices.find(s => s.id === service.id) ? "default" : "outline"}
                                  className={cn(
                                    "shadow-sm transition-all min-w-[100px]",
                                    selectedServices.find(s => s.id === service.id) && "bg-green-600 hover:bg-green-700 border-green-600"
                                  )}
                                  size="sm"
                                  onClick={() => toggleService(service)}
                                >
                                  {selectedServices.find(s => s.id === service.id) ? (
                                    <><Check className="h-4 w-4 mr-1" /> Adicionado</>
                                  ) : (
                                    'Adicionar'
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))
                )}
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
                  {whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      {business.whatsapp}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">{business.whatsapp || 'Não informado'}</p>
                  )}
                </div>

                <Button
                  className="w-full h-12 text-base"
                  onClick={handleStartBooking}
                  disabled={isSuspended}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  {isSuspended ? 'Temporariamente indisponível' : 'Agendar agora'}
                </Button>
                {isSuspended && (
                  <p className="text-[11px] text-center text-red-500 font-medium mt-2">
                    Este estabelecimento não está aceitando novos agendamentos no momento.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Summary Bar */}
        {selectedServices.length > 0 && !isBookingOpen && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-2xl bg-primary text-primary-foreground shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-40">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-90 uppercase tracking-wider mb-0.5">
                {selectedServices.length} {selectedServices.length === 1 ? 'serviço selecionado' : 'serviços selecionados'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{formatCurrency(totalPrice)}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-sm opacity-80">{formatDuration(totalDuration)}</span>
              </div>
            </div>
            <Button
              onClick={handleStartBooking}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold px-8 rounded-xl shadow-lg transition-transform active:scale-95"
              disabled={isSuspended}
            >
              {isSuspended ? 'Indisponível' : 'Agendar Agora'}
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16 pt-12 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Avaliações dos clientes</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="h-6 w-6 fill-warning text-warning" />
                  <span className="text-2xl font-bold">{rating}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{reviewsCount} {reviewsCount === 1 ? 'avaliação' : 'avaliações'}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => setIsReviewOpen(true)}
              disabled={reviewSubmitted}
            >
              {reviewSubmitted ? 'Avaliação enviada' : 'Avaliar estabelecimento'}
            </Button>
          </div>

          {reviewSubmitted && (
            <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-primary fill-primary" />
              </div>
              <p className="text-sm">
                <strong>Obrigado pelo seu feedback!</strong> Sua avaliação foi recebida e aparecerá aqui assim que for revisada pelo estabelecimento.
              </p>
            </div>
          )}

          {bReviews.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed">
              <p className="text-muted-foreground">Nenhuma avaliação publicada ainda. Seja o primeiro!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {bReviews.map((review: any) => (
                <Card key={review.id} className="border-none shadow-soft bg-card/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= review.nota ? "text-warning fill-warning" : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    {review.comentario && (
                      <p className="text-foreground italic mb-4">"{review.comentario}"</p>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {review.cliente_nome.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{review.cliente_nome}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                  <p className="text-sm text-muted-foreground">Passo {bookingStep} de 4</p>
                  <DialogTitle>
                    {bookingStep === 1 && 'Selecionar serviços'}
                    {bookingStep === 2 && 'Selecionar horário'}
                    {bookingStep === 3 && 'Informações pessoais'}
                    {bookingStep === 4 && 'Confirmar agendamento'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Fluxo de agendamento online para {business.nome}
                  </DialogDescription>
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
                  {/* Category Selection Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    {selectedCategories.map(category => (
                      <div key={category} className="space-y-2">
                        {selectedCategories.length > 1 && (
                          <p className="text-xs font-bold text-muted-foreground uppercase">{category}</p>
                        )}
                        {groupedServices[category]?.map((service) => {
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
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Time */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  {/* Professional Selection */}
                  {professionals.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Selecione o profissional</h3>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        <button
                          onClick={() => {
                            setSelectedProfessionalId('any');
                            setSelectedTime(null);
                          }}
                          className={cn(
                            'flex flex-col items-center gap-2 min-w-[100px] p-3 rounded-xl border transition-all',
                            selectedProfessionalId === 'any'
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <User2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-semibold text-center leading-tight">
                            Qualquer profissional
                          </span>
                        </button>
                        {professionals.filter(p => p.ativo).map((pro) => (
                          <button
                            key={pro.id}
                            onClick={() => {
                              setSelectedProfessionalId(pro.id);
                              setSelectedTime(null);
                            }}
                            className={cn(
                              'flex flex-col items-center gap-2 min-w-[100px] p-3 rounded-xl border transition-all',
                              selectedProfessionalId === pro.id
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            {pro.avatar_url ? (
                              <img src={pro.avatar_url} alt={pro.nome} className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold">{pro.nome.charAt(0)}</span>
                              </div>
                            )}
                            <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
                              {pro.nome}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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

              {/* Step 3: Client Info */}
              {bookingStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                      <Input
                        id="telefone"
                        placeholder="+55 (00) 00000-0000"
                        value={clientInfo.telefone}
                        onChange={(e) => {
                          const formatted = formatPhoneHelper(e.target.value);
                          setClientInfo(prev => ({ ...prev, telefone: formatted }));
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">Informe o DDD e o número do seu celular.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        placeholder="Como você gostaria de ser chamado?"
                        value={clientInfo.nome}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="para receber confirmações"
                        value={clientInfo.email}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <p className="text-[10px] text-muted-foreground">Enviaremos uma cópia do agendamento para este e-mail.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm text-primary flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                      Ao prosseguir, você concorda que o estabelecimento entrará em contato via WhatsApp para confirmar o agendamento.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Confirm */}
              {bookingStep === 4 && (
                <div className="space-y-6">
                  {/* Business Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                    <img
                      src={businessImage}
                      alt={business.nome}
                      className="h-16 w-16 rounded-lg object-cover shadow-sm"
                    />
                    <div>
                      <h3 className="font-semibold">{business.nome}</h3>
                      <p className="text-sm text-muted-foreground">{fullAddress || 'A definir'}</p>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2 text-muted-foreground uppercase text-[10px] tracking-wider">Serviços selecionados</h3>
                      <div className="space-y-2">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex items-center justify-between py-2 border-b last:border-0 border-dashed">
                            <div>
                              <p className="font-medium">{service.nome}</p>
                              <p className="text-xs text-muted-foreground italic">
                                {formatDuration(service.duracao_min)}
                              </p>
                            </div>
                            <span className="font-semibold">{formatCurrency(service.preco)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border bg-muted/20">
                        <h3 className="font-medium mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Data e horário</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{formatDateFull(selectedDate)} às <span className="font-bold">{selectedTime}</span></span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border bg-muted/20">
                        <h3 className="font-medium mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Atendimento</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <User2 className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">
                            {selectedProfessionalId === 'any'
                              ? 'Qualquer profissional'
                              : professionals.find(p => p.id === selectedProfessionalId)?.nome}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-primary/10">
                      <div className="flex items-center justify-between text-xl">
                        <span className="font-bold">Total</span>
                        <span className="font-black text-primary">{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Duração estimada: {formatDuration(totalDuration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-xs text-orange-700 font-medium">
                      O pagamento será realizado diretamente no estabelecimento.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Sidebar (desktop) */}
            {selectedServices.length > 0 && bookingStep < 3 && (
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
            {bookingStep === 4 ? (
              <Button
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                onClick={handleConfirmBooking}
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processando...</>
                ) : (
                  'Confirmar agendamento'
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="sm:hidden">
                  {selectedServices.length > 0 && (
                    <p className="text-sm">
                      <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                      <span className="text-muted-foreground"> • {selectedServices.length} serv.</span>
                    </p>
                  )}
                </div>
                <Button
                  className="flex-1 sm:flex-none sm:min-w-[160px] h-12 ml-auto font-semibold"
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
      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deixe sua avaliação</DialogTitle>
            <DialogDescription>
              Compartilhe sua experiência em {business.nome}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-3">
              <Label className="text-center">Sua nota</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="transition-transform hover:scale-110 p-1"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        s <= reviewRating ? "text-warning fill-warning" : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rev-name">Seu nome</Label>
              <Input
                id="rev-name"
                placeholder="Como quer ser identificado?"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rev-comment">Comentário (opcional)</Label>
              <textarea
                id="rev-comment"
                placeholder="Conte o que você achou do atendimento..."
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => reviewMutation.mutate({ nota: reviewRating, comentario: reviewComment, nome: reviewName })}
              disabled={reviewRating === 0 || !reviewName || reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
