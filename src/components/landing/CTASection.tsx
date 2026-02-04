import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 mb-6">
            <Sparkles className="h-4 w-4" />
            Comece gratuitamente
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl mb-6">
            Pronto para transformar seus agendamentos?
          </h2>

          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Junte-se a centenas de empresas que já simplificaram sua gestão de agendamentos com o PrimeBooking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 shadow-lg group"
              onClick={() => navigate("/signup")}
            >
              Começar teste grátis
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate("/book")}
            >
              Ver demonstração
            </Button>
          </div>

          <p className="text-sm text-white/60 mt-6">
            Sem cartão de crédito • Setup em 5 minutos • Suporte incluído
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
