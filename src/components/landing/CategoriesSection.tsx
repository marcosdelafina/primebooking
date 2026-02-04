import { 
  Scissors, 
  Sparkles, 
  Dumbbell, 
  GraduationCap, 
  Stethoscope, 
  Wrench,
  Users,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    icon: Scissors,
    title: "Salões de Beleza",
    description: "Cortes, coloração, tratamentos capilares e muito mais.",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    icon: Scissors,
    title: "Barbearias",
    description: "Cortes masculinos, barba e cuidados pessoais.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Sparkles,
    title: "Clínicas de Estética",
    description: "Procedimentos estéticos, massagens e bem-estar.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: Dumbbell,
    title: "Academias",
    description: "Personal trainers, aulas particulares e avaliações.",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: GraduationCap,
    title: "Professores",
    description: "Aulas de idiomas, reforço escolar e tutoria.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Stethoscope,
    title: "Profissionais da Saúde",
    description: "Consultas médicas, terapias e atendimentos.",
    color: "bg-red-500/10 text-red-600",
  },
  {
    icon: Wrench,
    title: "Oficinas Mecânicas",
    description: "Revisões, manutenções e serviços automotivos.",
    color: "bg-slate-500/10 text-slate-600",
  },
  {
    icon: Building2,
    title: "Outros Serviços",
    description: "Qualquer negócio que trabalhe com agendamentos.",
    color: "bg-primary/10 text-primary",
  },
];

const CategoriesSection = () => {
  return (
    <section id="categorias" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Users className="h-3 w-3 mr-1" />
            Para quem é
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Perfeito para{" "}
            <span className="text-gradient">diversos segmentos</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            O PrimeBooking foi pensado para atender diferentes tipos de negócios 
            que trabalham com hora marcada.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg ${category.color}`}>
                <category.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">
                {category.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
