import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
export function getWhatsAppLink(phone: string) {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}`;
}
