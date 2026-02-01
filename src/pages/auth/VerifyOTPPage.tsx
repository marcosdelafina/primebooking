import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Calendar, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { mockVerifyOTP } from '@/lib/mock-services';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const telefone = location.state?.telefone || '+55••••••••99';

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: 'Código incompleto',
        description: 'Digite os 6 dígitos do código.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await mockVerifyOTP(telefone, code);
      if (result.data.verified) {
        setIsVerified(true);
        toast({
          title: 'Verificado!',
          description: 'Seu telefone foi verificado com sucesso.',
        });
        // Redirect after a brief success state
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        toast({
          title: 'Código inválido',
          description: result.message || 'Verifique o código e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao verificar código',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    toast({
      title: 'Código reenviado',
      description: 'Verifique seu WhatsApp.',
    });
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">PrimeBooking</span>
          </Link>
        </header>

        {/* Success State */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Conta verificada!</h1>
              <p className="text-muted-foreground">
                Sua conta foi criada com sucesso.<br />
                Redirecionando para o painel...
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary-foreground" />
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
            onClick={() => navigate('/signup')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>

          {/* Title */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-foreground">Verifique seu telefone</h1>
            <p className="text-muted-foreground">
              Enviamos um código de 6 dígitos para<br />
              <span className="font-medium text-foreground">{telefone}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="bg-card rounded-2xl shadow-card p-8">
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading || code.length !== 6}
                onClick={handleVerify}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar código'
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o código?{' '}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={handleResendCode}
                  >
                    Reenviar
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Hint */}
          <p className="text-center text-sm text-muted-foreground">
            Para demo, qualquer código de 6 dígitos funciona
          </p>
        </div>
      </main>
    </div>
  );
}
