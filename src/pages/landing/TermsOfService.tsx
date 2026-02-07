import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <div className="h-9 w-9 overflow-hidden rounded-lg shadow-sm">
              <img src="/logo-p.png" alt="PrimeBooking Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Prime<span className="text-primary">Booking</span>
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/landing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
              <p className="text-muted-foreground">Última atualização: 04 de fevereiro de 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="lead text-lg text-muted-foreground">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma PrimeBooking.
            </p>
            <p className="text-muted-foreground">
              Ao utilizar a plataforma, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Identificação da Plataforma e do Operador</h2>
            <p className="text-muted-foreground mb-4">A plataforma PrimeBooking é um software como serviço (SaaS) desenvolvido e operado por:</p>
            <div className="p-4 rounded-lg bg-muted/50 border mb-4">
              <p className="text-foreground font-medium">Nome Fantasia: Appsbuilding</p>
              <p className="text-muted-foreground text-sm">Razão Social: Delafina Consultoria em Informática e Treinamento em Desenvolvimento Profissional Ltda.</p>
              <p className="text-muted-foreground text-sm">CNPJ: 09.646.497/0001-94</p>
              <p className="text-muted-foreground text-sm mt-2">
                <strong>Endereço:</strong><br />
                Avenida Juscelino Kubitschek de Oliveira, nº 1225<br />
                Loteamento Inocoop<br />
                Mogi Mirim – SP<br />
                CEP: 13806-520
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                <strong>E-mail:</strong> contato@appsbuilding.com
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>WhatsApp:</strong>{" "}
                <a
                  href="https://wa.me/5519997006540"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  +55 19 99700-6540
                </a>
              </p>
            </div>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground mb-4">O PrimeBooking é uma plataforma de agendamento online que permite:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Cadastro de serviços e profissionais</li>
              <li>Gestão de clientes</li>
              <li>Agendamento e controle de atendimentos</li>
              <li>Notificações por e-mail</li>
              <li>Integração opcional com Google Agenda</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Elegibilidade e Obrigações do Usuário</h2>
            <p className="text-muted-foreground mb-4">O usuário declara que:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Possui capacidade legal para contratar</li>
              <li>Utiliza a plataforma para fins lícitos</li>
              <li>Fornece informações verdadeiras e atualizadas</li>
              <li>É responsável pelos dados inseridos na plataforma</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Conta do Usuário</h2>
            <p className="text-muted-foreground mb-4">O usuário é responsável por:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Manter a confidencialidade de suas credenciais</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>O uso adequado e legal da plataforma</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Assinatura e Pagamento</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>O PrimeBooking é disponibilizado mediante assinatura mensal no valor de <strong className="text-foreground">R$ 29,90</strong></li>
              <li>A cobrança é recorrente</li>
              <li>O não pagamento poderá resultar na suspensão ou cancelamento do acesso</li>
              <li>Os valores poderão ser alterados mediante aviso prévio</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Cancelamento</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>O usuário pode cancelar a assinatura a qualquer momento</li>
              <li>O cancelamento não gera reembolso proporcional do período vigente</li>
              <li>Após o cancelamento, o acesso à plataforma poderá ser encerrado</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Uso Indevido</h2>
            <p className="text-muted-foreground mb-4">É vedado ao usuário:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Utilizar a plataforma para fins ilegais</li>
              <li>Inserir dados sem autorização dos titulares</li>
              <li>Praticar atos que comprometam a segurança do sistema</li>
              <li>Tentar acessar áreas não autorizadas</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground mb-4">A Appsbuilding não se responsabiliza por:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Falhas de conexão à internet ou serviços de terceiros</li>
              <li>Indisponibilidade temporária da plataforma</li>
              <li>Cancelamentos, faltas ou conflitos entre usuários e clientes finais</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Funcionalidades em Desenvolvimento</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Algumas funcionalidades podem estar em fase de desenvolvimento</li>
              <li>Notificações via WhatsApp estão em desenvolvimento</li>
              <li>A plataforma pode ser alterada, atualizada ou descontinuada parcialmente</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todos os direitos sobre a plataforma, marca, layout, textos e código-fonte pertencem à Appsbuilding, sendo vedada a reprodução sem autorização.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">11. Rescisão</h2>
            <p className="text-muted-foreground">
              A Appsbuilding poderá suspender ou encerrar contas que violem estes Termos, sem prejuízo de medidas legais cabíveis.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">12. Legislação e Foro</h2>
            <p className="text-muted-foreground">
              Estes Termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o foro do domicílio da Appsbuilding para dirimir quaisquer controvérsias.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">13. Contato</h2>
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
              <p className="text-foreground font-medium flex items-center gap-2">
                📧 E-mail: contato@appsbuilding.com
              </p>
              <p className="text-foreground font-medium flex items-center gap-2 mt-2">
                📱 WhatsApp:{" "}
                <a
                  href="https://wa.me/5519997006540"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  +55 19 99700-6540
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PrimeBooking. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link to="/privacy" className="text-xs hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/terms" className="text-xs hover:text-primary transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
