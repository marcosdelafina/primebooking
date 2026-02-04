import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phoneNumber = "5519997006540";
  const message = "Olá! Gostaria de saber mais sobre o PrimeBooking.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all hover:bg-[#20BD5A] hover:shadow-xl hover:scale-105 group"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline text-sm font-medium">
        Dúvidas? Fale conosco
      </span>
    </a>
  );
};

export default WhatsAppButton;
