import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state");

            if (!code || !state) {
                setStatus("error");
                setErrorMessage("Código ou estado de autorização ausente.");
                return;
            }

            try {
                const { data: _data, error } = await supabase.functions.invoke("google-calendar-auth", {
                    body: { code, state },
                });

                if (error) throw error;

                setStatus("success");
                toast({
                    title: "Sucesso!",
                    description: "Sua conta do Google foi conectada com sucesso.",
                });

                // Redirect after 2 seconds
                setTimeout(() => {
                    navigate("/admin/professionals?sync=success");
                }, 2000);
            } catch (err: any) {
                console.error("Error exchanging code:", err);
                setStatus("error");
                setErrorMessage(err.message || "Erro ao conectar com o Google Agenda.");
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full p-8 shadow-lg border-none">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <img
                            src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png"
                            alt="Google Calendar"
                            className="w-8 h-8"
                        />
                    </div>

                    {status === "loading" && (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <h2 className="text-2xl font-bold text-slate-900">Conectando...</h2>
                            <p className="text-slate-500">
                                Estamos finalizando a conexão com sua conta do Google Agenda.
                            </p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <h2 className="text-2xl font-bold text-slate-900">Conectado!</h2>
                            <p className="text-slate-500">
                                Tudo pronto! Você será redirecionado para a página de profissionais em instantes.
                            </p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="h-12 w-12 text-red-500" />
                            <h2 className="text-2xl font-bold text-slate-900">Erro na Conexão</h2>
                            <p className="text-red-500 font-medium">{errorMessage}</p>
                            <button
                                onClick={() => navigate("/admin/professionals")}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Voltar para Profissionais
                            </button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
