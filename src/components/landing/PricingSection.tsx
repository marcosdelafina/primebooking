import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  "Agendamentos ilimitados",
  "Clientes ilimitados",
  "Serviços ilimitados",
  "Profissionais ilimitados",
  "Confirmações automáticas por e-mail",
  "Página pública de agendamento",
  "Integração com Google Agenda",
  "Painel de controle completo",
  "Relatórios e métricas",
  "Suporte via WhatsApp",
];

const PricingSection = () => {
  const navigate = useNavigate();
  return (
    <section id="precos" className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Preços
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Um plano{" "}
            <span className="text-gradient">simples e completo</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Sem surpresas, sem taxas escondidas.
            Tudo que você precisa por um preço justo.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="relative rounded-3xl border-2 border-primary bg-card p-8 md:p-10 shadow-elegant">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                Plano Único
              </Badge>
            </div>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg text-muted-foreground">R$</span>
                <span className="text-6xl font-bold text-foreground">29</span>
                <span className="text-2xl font-bold text-foreground">,90</span>
              </div>
              <p className="text-muted-foreground mt-2">por mês</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button size="lg" className="w-full shadow-elegant group" onClick={() => navigate("/signup")}>
              Começar agora
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              7 dias grátis para testar. Cancele quando quiser.
            </p>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Dúvidas sobre o plano?{" "}
            <a
              href="https://wa.me/5519997006540"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              Fale conosco no WhatsApp
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
