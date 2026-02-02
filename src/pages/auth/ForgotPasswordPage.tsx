import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations';
import { mockRequestPasswordReset } from '@/lib/mock-services';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await mockRequestPasswordReset(data.email);
      if (result.data.sent) {
        setEmailSent(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada.',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
              <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold text-foreground">PrimeBooking</span>
          </Link>
        </header>

        {/* Success State */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Mail className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Verifique seu email</h1>
              <p className="text-muted-foreground">
                Enviamos instruções para redefinir sua senha para<br />
                <span className="font-medium text-foreground">{form.getValues('email')}</span>
              </p>
            </div>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Voltar para login
              </Button>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setEmailSent(false)}
              >
                Não recebeu? Enviar novamente
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold text-foreground">PrimeBooking</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Esqueceu sua senha?</h1>
            <p className="text-muted-foreground">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl shadow-card p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
