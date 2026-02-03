import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthConfirmPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando sua autenticação...');

    useEffect(() => {
        let isMounted = true;

        const handleVerification = async () => {
            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type') as any;
            const next = searchParams.get('next') || '/admin';

            if (!tokenHash || !type) {
                if (isMounted) {
                    setStatus('error');
                    setMessage('Link de verificação inválido ou expirado.');
                }
                return;
            }

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: type,
                });

                if (error) throw error;

                if (isMounted) {
                    setStatus('success');
                    setMessage('Verificação concluída com sucesso!');

                    // Redirect after a short delay
                    setTimeout(() => {
                        if (isMounted) navigate(next, { replace: true });
                    }, 1000);
                }

            } catch (error: any) {
                console.error('Verification error:', error);

                // If it's a "Token has expired or is invalid" error, 
                // check if we already have a session, which means it might have worked 
                // in a previous run (Strict Mode) or handled elsewhere.
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    if (isMounted) navigate(next, { replace: true });
                    return;
                }

                if (isMounted) {
                    setStatus('error');
                    setMessage(error.message || 'Ocorreu um erro ao verificar sua conta.');
                }
            }
        };

        handleVerification();

        return () => {
            isMounted = false;
        };
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col relative">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center bg-card shadow-lg ring-1 ring-border">
                            <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">PrimeBooking</h1>
                    </div>

                    <div className="bg-card rounded-2xl shadow-card p-8 border border-border/50">
                        <div className="flex flex-col items-center gap-6">
                            {status === 'loading' && (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-semibold text-foreground">Aguarde um momento</h2>
                                        <p className="text-muted-foreground">{message}</p>
                                    </div>
                                </>
                            )}

                            {status === 'success' && (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-success" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-semibold text-foreground">Tudo certo!</h2>
                                        <p className="text-muted-foreground">{message}</p>
                                        <p className="text-xs text-muted-foreground mt-4 animate-pulse">Redirecionando...</p>
                                    </div>
                                </>
                            )}

                            {status === 'error' && (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <XCircle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-semibold text-foreground">Ops, algo deu errado</h2>
                                        <p className="text-muted-foreground">{message}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="mt-4 text-primary font-medium hover:underline text-sm"
                                    >
                                        Voltar para o login
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="p-8 text-center text-sm text-muted-foreground">
                © 2026 PrimeBooking. Todos os direitos reservados.
            </footer>
        </div>
    );
}
