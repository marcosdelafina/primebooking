import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
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
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) throw error;

            setIsSuccess(true);
            toast({
                title: 'Senha redefinida!',
                description: 'Sua nova senha foi salva com sucesso.',
            });

            // Redirect after success
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Falha ao redefinir senha',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col">
                <header className="p-6">
                    <Link to="/" className="flex items-center gap-2 w-fit">
                        <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-card shadow-sm border border-border">
                            <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-xl font-bold text-foreground">PrimeBooking</span>
                    </Link>
                </header>

                <main className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
                        <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-10 w-10 text-success" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-foreground">Sua senha foi alterada!</h1>
                            <p className="text-muted-foreground">
                                Agora você já pode fazer login com sua nova credencial.<br />
                                Redirecionando para a tela de login...
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
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex flex-col relative">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <header className="p-6">
                <Link to="/" className="flex items-center gap-2 w-fit">
                    <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-card shadow-sm border border-border">
                        <img src="/favicon.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xl font-bold text-foreground">PrimeBooking</span>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="max-w-md w-full space-y-8 animate-fade-in">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Voltar para login
                    </button>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-foreground">Nova senha</h1>
                        <p className="text-muted-foreground">
                            Crie uma nova senha segura para sua conta.
                        </p>
                    </div>

                    <div className="bg-card rounded-2xl shadow-card p-8 border border-border/50">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nova Senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmar Nova Senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4" />
                                            Alterar minha senha
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <p className="text-xs text-primary/80 leading-relaxed italic">
                            Dica: Use uma combinação de letras maiúsculas, números e pelo menos 6 caracteres para garantir a segurança da sua conta.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="p-8 text-center text-sm text-muted-foreground">
                © 2026 PrimeBooking. Todos os direitos reservados.
            </footer>
        </div>
    );
}
