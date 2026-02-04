import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 overflow-hidden rounded-lg shadow-sm">
                <img src="/logo-p.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Prime<span className="text-primary">Booking</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A plataforma completa para gerenciar seus agendamentos de forma simples e profissional.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Produto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#beneficios" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Benefícios
                </a>
              </li>
              <li>
                <a href="#categorias" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Para quem
                </a>
              </li>
              <li>
                <a href="#precos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Preços
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a
                  href="https://wa.me/5519997006540"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  +55 19 99700-6540
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a
                  href="mailto:contato@appsbuilding.com"
                  className="hover:text-primary transition-colors"
                >
                  contato@appsbuilding.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} PrimeBooking. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground">
              Feito com 💙 para simplificar agendamentos
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
