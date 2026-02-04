import { 
  Clock, 
  CheckCircle2, 
  CalendarSync, 
  Mail, 
  Globe, 
  LayoutDashboard,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const benefits = [
  {
    icon: Clock,
    title: "Agendamentos 24/7",
    description: "Seus clientes podem agendar a qualquer hora, de qualquer lugar. Você recebe tudo organizado.",
  },
  {
    icon: CheckCircle2,
    title: "Confirmações Automáticas",
    description: "Reduza faltas com confirmações automáticas por e-mail. Menos no-shows, mais receita.",
  },
  {
    icon: CalendarSync,
    title: "Google Agenda",
    description: "Sincronize automaticamente com sua agenda Google. Nunca mais tenha conflitos de horário.",
  },
  {
    icon: Mail,
    title: "Notificações por E-mail",
    description: "Lembretes automáticos para você e seus clientes. Comunicação profissional sem esforço.",
  },
  {
    icon: Globe,
    title: "Página Pública",
    description: "Sua empresa com link exclusivo para agendamentos. Compartilhe nas redes sociais e divulgue.",
  },
  {
    icon: LayoutDashboard,
    title: "Painel Intuitivo",
    description: "Dashboard completo para gerenciar seu negócio. Visualize tudo em um só lugar.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Funcionalidades
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">gerenciar agendamentos</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Simplifique sua rotina com ferramentas poderosas e fáceis de usar. 
            Foque no que importa: atender seus clientes.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp Coming Soon */}
        <div className="mt-12 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Notificações via WhatsApp
                </h3>
                <Badge variant="outline" className="text-xs">
                  Em breve
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Estamos trabalhando para trazer notificações via WhatsApp em breve. 
                Seus clientes receberão lembretes diretamente no celular!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
