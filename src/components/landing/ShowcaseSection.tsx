import { Badge } from "@/components/ui/badge";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel";
import { Camera } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

const showcaseItems = [
    {
        title: "Painel de Controle Inteligente",
        description: "Tudo o que você precisa para gerenciar seus agendamentos em uma única tela.",
        image: "/landing/app-dashboard.jpg"
    },
    {
        title: "Agendamento Simples e Rápido",
        description: "Interface intuitiva para seus clientes escolherem o melhor horário.",
        image: "/landing/app-booking.jpg"
    },
    {
        title: "Detalhes do Agendamento",
        description: "Visualize e gerencie cada compromisso com facilidade.",
        image: "/landing/app-details.jpg"
    },
    {
        title: "Notificações: Solicitação Recebida",
        description: "Seu cliente recebe um e-mail profissional assim que solicita um horário.",
        image: "/landing/email-requested.png"
    },
    {
        title: "Notificações: Agendamento Confirmado",
        description: "Confirmação automática para garantir o comparecimento.",
        image: "/landing/email-confirmed.png"
    },
    {
        title: "Notificações: Horário Alterado",
        description: "Mantenha o cliente sempre informado sobre mudanças.",
        image: "/landing/email-changed.png"
    }
];

const ShowcaseSection = () => {
    const plugin = React.useRef(
        Autoplay({ delay: 3500, stopOnInteraction: false })
    );

    return (
        <section className="py-20 md:py-28 bg-muted/30 overflow-hidden">
            <div className="container px-4">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-16 px-4">
                    <Badge variant="secondary" className="mb-4">
                        <Camera className="h-3 w-3 mr-1" />
                        Visual
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                        Veja o <span className="text-gradient">PrimeBooking</span> em ação
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Uma plataforma pensada na experiência do seu cliente e na sua produtividade.
                        Confira como o sistema se apresenta para você e seus clientes com capturas reais.
                    </p>
                </div>

                {/* Balanced visibility carousel - Slightly larger (2 items on desktop) */}
                <div className="relative max-w-6xl mx-auto px-4 md:px-12">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[plugin.current]}
                        onMouseEnter={plugin.current.stop}
                        onMouseLeave={plugin.current.reset}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {showcaseItems.map((item, index) => (
                                <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/2">
                                    <div className="flex flex-col gap-4 h-full group">
                                        <div className="relative rounded-3xl border-2 border-primary/20 overflow-hidden shadow-elegant transition-all duration-500 bg-white flex items-center justify-center p-4 md:p-6 hover:border-primary/40 min-h-[350px] md:min-h-[450px]">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-auto h-auto max-w-full max-h-[300px] md:max-h-[400px] rounded-xl object-contain transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {/* Decorative gradient overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                        </div>
                                        <div className="text-center md:text-left px-4">
                                            <h3 className="font-bold text-xl text-foreground mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-4 md:-left-14 h-11 w-11 border-primary/20 text-primary" />
                        <CarouselNext className="-right-4 md:-right-14 h-11 w-11 border-primary/20 text-primary" />
                    </Carousel>
                </div>
            </div>
        </section>
    );
};

export default ShowcaseSection;
