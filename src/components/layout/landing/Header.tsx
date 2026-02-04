import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { href: "#beneficios", label: "Benefícios" },
    { href: "#categorias", label: "Para quem" },
    { href: "#precos", label: "Preços" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 overflow-hidden rounded-lg shadow-sm">
            <img src="/logo-p.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Prime<span className="text-primary">Booking</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Entrar
          </Button>
          <Button size="sm" className="shadow-elegant" onClick={() => navigate("/signup")}>
            Começar agora
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <div className="flex flex-col gap-6 pt-6">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <div className="h-9 w-9 overflow-hidden rounded-lg shadow-sm">
                  <img src="/logo-p.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  Prime<span className="text-primary">Booking</span>
                </span>
              </Link>

              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="flex flex-col gap-3 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button className="w-full shadow-elegant" onClick={() => navigate("/signup")}>
                  Começar agora
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
