
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

const countries = [
    { label: "Afeganistão", value: "AF", code: "+93" },
    { label: "África do Sul", value: "ZA", code: "+27" },
    { label: "Albânia", value: "AL", code: "+355" },
    { label: "Alemanha", value: "DE", code: "+49" },
    { label: "Andorra", value: "AD", code: "+376" },
    { label: "Angola", value: "AO", code: "+244" },
    { label: "Antígua e Barbuda", value: "AG", code: "+1-268" },
    { label: "Arábia Saudita", value: "SA", code: "+966" },
    { label: "Argélia", value: "DZ", code: "+213" },
    { label: "Argentina", value: "AR", code: "+54" },
    { label: "Armênia", value: "AM", code: "+374" },
    { label: "Austrália", value: "AU", code: "+61" },
    { label: "Áustria", value: "AT", code: "+43" },
    { label: "Azerbaijão", value: "AZ", code: "+994" },

    { label: "Bahamas", value: "BS", code: "+1-242" },
    { label: "Bangladesh", value: "BD", code: "+880" },
    { label: "Barbados", value: "BB", code: "+1-246" },
    { label: "Bélgica", value: "BE", code: "+32" },
    { label: "Belize", value: "BZ", code: "+501" },
    { label: "Benim", value: "BJ", code: "+229" },
    { label: "Bolívia", value: "BO", code: "+591" },
    { label: "Bósnia e Herzegovina", value: "BA", code: "+387" },
    { label: "Botsuana", value: "BW", code: "+267" },
    { label: "Brasil", value: "BR", code: "+55" },
    { label: "Brunei", value: "BN", code: "+673" },
    { label: "Bulgária", value: "BG", code: "+359" },

    { label: "Cabo Verde", value: "CV", code: "+238" },
    { label: "Camarões", value: "CM", code: "+237" },
    { label: "Canadá", value: "CA", code: "+1" },
    { label: "Catar", value: "QA", code: "+974" },
    { label: "Chile", value: "CL", code: "+56" },
    { label: "China", value: "CN", code: "+86" },
    { label: "Chipre", value: "CY", code: "+357" },
    { label: "Colômbia", value: "CO", code: "+57" },
    { label: "Coreia do Sul", value: "KR", code: "+82" },
    { label: "Costa Rica", value: "CR", code: "+506" },
    { label: "Croácia", value: "HR", code: "+385" },
    { label: "Cuba", value: "CU", code: "+53" },

    { label: "Dinamarca", value: "DK", code: "+45" },
    { label: "Dominica", value: "DM", code: "+1-767" },

    { label: "Egito", value: "EG", code: "+20" },
    { label: "El Salvador", value: "SV", code: "+503" },
    { label: "Emirados Árabes Unidos", value: "AE", code: "+971" },
    { label: "Equador", value: "EC", code: "+593" },
    { label: "Eslováquia", value: "SK", code: "+421" },
    { label: "Eslovênia", value: "SI", code: "+386" },
    { label: "Espanha", value: "ES", code: "+34" },
    { label: "Estados Unidos", value: "US", code: "+1" },
    { label: "Estônia", value: "EE", code: "+372" },

    { label: "Filipinas", value: "PH", code: "+63" },
    { label: "Finlândia", value: "FI", code: "+358" },
    { label: "França", value: "FR", code: "+33" },

    { label: "Grécia", value: "GR", code: "+30" },
    { label: "Guatemala", value: "GT", code: "+502" },

    { label: "Honduras", value: "HN", code: "+504" },
    { label: "Hungria", value: "HU", code: "+36" },

    { label: "Índia", value: "IN", code: "+91" },
    { label: "Indonésia", value: "ID", code: "+62" },
    { label: "Irlanda", value: "IE", code: "+353" },
    { label: "Islândia", value: "IS", code: "+354" },
    { label: "Israel", value: "IL", code: "+972" },
    { label: "Itália", value: "IT", code: "+39" },

    { label: "Japão", value: "JP", code: "+81" },

    { label: "México", value: "MX", code: "+52" },

    { label: "Nigéria", value: "NG", code: "+234" },
    { label: "Noruega", value: "NO", code: "+47" },
    { label: "Nova Zelândia", value: "NZ", code: "+64" },

    { label: "Países Baixos", value: "NL", code: "+31" },
    { label: "Paraguai", value: "PY", code: "+595" },
    { label: "Peru", value: "PE", code: "+51" },
    { label: "Polônia", value: "PL", code: "+48" },
    { label: "Portugal", value: "PT", code: "+351" },

    { label: "Reino Unido", value: "GB", code: "+44" },
    { label: "República Dominicana", value: "DO", code: "+1-809" },
    { label: "Romênia", value: "RO", code: "+40" },

    { label: "Suécia", value: "SE", code: "+46" },
    { label: "Suíça", value: "CH", code: "+41" },

    { label: "Turquia", value: "TR", code: "+90" },

    { label: "Ucrânia", value: "UA", code: "+380" },
    { label: "Uruguai", value: "UY", code: "+598" },

    { label: "Venezuela", value: "VE", code: "+58" }
] as const;

type Country = typeof countries[number]['value'];

export interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
    value?: string;
    onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        const [open, setOpen] = React.useState(false);
        const [selectedCountry, setSelectedCountry] = React.useState<Country>("BR");
        const [inputValue, setInputValue] = React.useState("");

        // Initialize state from prop value
        React.useEffect(() => {
            if (value) {
                try {
                    const phoneNumber = parsePhoneNumber(value);
                    if (phoneNumber) {
                        setSelectedCountry(phoneNumber.country as Country || "BR" as Country);
                        setInputValue(phoneNumber.format("NATIONAL"));
                    } else {
                        setInputValue(value);
                    }
                } catch (e) {
                    setInputValue(value);
                }
            } else {
                setInputValue("");
            }
        }, [value]);


        const handleCountrySelect = (countryCode: Country) => {
            setSelectedCountry(countryCode);
            setOpen(false);

            // If we have existing input, try to re-parse with new country
            if (inputValue && onChange) {
                try {
                    const phoneNumber = parsePhoneNumber(inputValue, countryCode);
                    if (phoneNumber && phoneNumber.isValid()) {
                        onChange(phoneNumber.number as string);
                    }
                } catch (err) {
                    // Ignore
                }
            }
        };

        const handleSmartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            // Visual Formatting
            const asYouType = new AsYouType(selectedCountry as CountryCode);
            const formatted = asYouType.input(raw);

            setInputValue(formatted);

            // E.164 Export
            try {
                const phoneNumber = parsePhoneNumber(raw, selectedCountry as CountryCode);
                if (phoneNumber && phoneNumber.isValid()) {
                    if (onChange) onChange(phoneNumber.number as string);
                } else {
                    if (onChange) onChange(raw);
                }
            } catch (err) {
                if (onChange) onChange(raw);
            }
        };

        const currentCountry = countries.find(c => c.value === selectedCountry);

        return (
            <div className={cn("flex gap-2", className)}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[70px] justify-between px-2 shrink-0"
                        >
                            {selectedCountry}
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Procurar país..." />
                            <CommandList>
                                <CommandEmpty>País não encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {countries.map((country) => (
                                        <CommandItem
                                            key={country.value}
                                            value={country.label}
                                            onSelect={() => handleCountrySelect(country.value)}
                                        >
                                            <div className={cn(
                                                "mr-2 h-4 w-4 border rounded flex items-center justify-center transition-colors",
                                                selectedCountry === country.value ? "bg-primary border-primary" : "border-muted-foreground/30"
                                            )}>
                                                {selectedCountry === country.value && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className="mr-2 text-muted-foreground font-mono text-xs w-10">{country.code}</span>
                                            {country.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Input
                    {...props}
                    ref={ref}
                    value={inputValue}
                    onChange={handleSmartChange}
                    placeholder={currentCountry ? `Ex: ${currentCountry.value === 'BR' ? '(11) 99999-9999' : 'Telefone'}` : "Telefone"}
                    className="flex-1"
                    type="tel"
                />
            </div>
        );
    }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
