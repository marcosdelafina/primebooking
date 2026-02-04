import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
              <p className="text-muted-foreground">Última atualização: 04 de fevereiro de 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="lead text-lg text-muted-foreground">
              A PrimeBooking respeita a privacidade e a proteção dos dados pessoais de seus usuários e clientes finais. Esta Política de Privacidade descreve como os dados pessoais são coletados, utilizados, armazenados e protegidos no uso da plataforma.
            </p>
            <p className="text-muted-foreground">
              Ao utilizar a PrimeBooking, você declara estar ciente e de acordo com esta Política.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Identificação do Controlador</h2>
            <p className="text-muted-foreground mb-4">A plataforma PrimeBooking é desenvolvida e operada por:</p>
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
            <p className="text-muted-foreground">
              Para fins da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD), a Appsbuilding atua como Controladora dos Dados Pessoais tratados por meio da plataforma PrimeBooking.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Dados Pessoais Coletados</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.1. Dados fornecidos pelos usuários da plataforma</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Nome completo</li>
              <li>E-mail</li>
              <li>Número de telefone</li>
              <li>Nome da empresa</li>
              <li>Serviços e profissionais cadastrados</li>
              <li>Dados de clientes inseridos pelo próprio usuário</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.2. Dados de clientes finais</h3>
            <p className="text-muted-foreground mb-2">Quando um cliente realiza um agendamento:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Nome</li>
              <li>Telefone</li>
              <li>E-mail</li>
              <li>Serviço contratado</li>
              <li>Data e horário do atendimento</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.3. Dados técnicos</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Endereço IP</li>
              <li>Informações do dispositivo e navegador</li>
              <li>Registros de acesso e uso da plataforma (logs)</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Finalidades do Tratamento</h2>
            <p className="text-muted-foreground mb-4">Os dados pessoais são tratados para:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Prestação dos serviços de agendamento</li>
              <li>Gestão de clientes, serviços e profissionais</li>
              <li>Envio de notificações por e-mail</li>
              <li>Comunicação com usuários</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Segurança, prevenção a fraudes e melhoria da plataforma</li>
            </ul>
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                ⚠️ Notificações via WhatsApp estão em desenvolvimento. Quando esta funcionalidade for ativada, esta Política será atualizada.
              </p>
            </div>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground mb-4">A Appsbuilding não vende dados pessoais.</p>
            <p className="text-muted-foreground mb-4">Os dados poderão ser compartilhados apenas quando necessário com:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provedores de infraestrutura, hospedagem e armazenamento</li>
              <li>Serviços de envio de e-mail</li>
              <li>Integrações autorizadas pelo usuário (ex.: Google Agenda)</li>
              <li>Autoridades públicas, mediante obrigação legal ou ordem judicial</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground">
              Adotamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acessos não autorizados, vazamentos, perda, alteração ou destruição.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Retenção dos Dados</h2>
            <p className="text-muted-foreground mb-4">Os dados pessoais serão mantidos:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Enquanto a conta do usuário estiver ativa</li>
              <li>Pelo período exigido por lei</li>
              <li>Ou até solicitação de exclusão, quando legalmente aplicável</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Direitos dos Titulares</h2>
            <p className="text-muted-foreground mb-4">Nos termos da LGPD, o titular dos dados pode solicitar:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Exclusão ou anonimização</li>
              <li>Portabilidade</li>
              <li>Revogação de consentimentos</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              As solicitações devem ser feitas pelos canais de contato indicados nesta Política.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Cookies e Tecnologias Semelhantes</h2>
            <p className="text-muted-foreground">
              A plataforma pode utilizar cookies e tecnologias similares para garantir funcionalidade, segurança e melhor experiência do usuário.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Esta Política poderá ser alterada a qualquer momento. A versão vigente estará sempre disponível na plataforma.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Contato</h2>
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
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
