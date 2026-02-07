import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

const VideoSection = () => {
    return (
        <section id="demonstracao" className="py-20 md:py-28 bg-muted/30 overflow-hidden">
            <div className="container px-4">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <Badge variant="secondary" className="mb-4">
                        <Play className="h-3 w-3 mr-1" />
                        Demonstração
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                        Conheça o <span className="text-gradient">PrimeBooking</span> em 60 segundos
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Veja como é simples e rápido gerenciar seus agendamentos e encantar seus clientes.
                    </p>
                </div>

                {/* Video Container - Optimized for Shorts (Vertical) */}
                <div className="max-w-[400px] mx-auto">
                    <div className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-8 border-background bg-background group">
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://www.youtube.com/embed/GSvZdVg0b2k?autoplay=0&rel=0"
                            title="PrimeBooking Demonstration"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        ></iframe>

                        {/* Decorative frame elements */}
                        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[22px]"></div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground italic">
                            Assista ao vídeo e descubra por que centenas de profissionais escolheram o PrimeBooking.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VideoSection;
