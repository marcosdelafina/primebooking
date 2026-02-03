import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface MagicLinkEmailProps {
    user_name?: string
    app_url: string
    email_action_type: string
    redirect_to: string
    token_hash: string
    token: string
}

export const MagicLinkEmail = ({
    user_name,
    token,
    app_url,
    email_action_type,
    redirect_to,
    token_hash,
}: MagicLinkEmailProps) => {
    const isRecovery = email_action_type === 'recovery'
    const title = isRecovery ? 'Redefina sua senha' : 'Login no PrimeBooking'
    const previewText = isRecovery ? `Redefina sua senha do PrimeBooking` : `Acesse o PrimeBooking com este link`

    // Construct the verification link pointing to the 앱
    const linkHref = `${app_url}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${redirect_to}`

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={h1}>{title}</Heading>
                    </Section>

                    <Section style={content}>
                        <Text style={text}>
                            Olá{user_name ? ` ${user_name}` : ''},
                        </Text>

                        <Text style={text}>
                            {isRecovery
                                ? 'Recebemos uma solicitação para redefinir a sua senha no PrimeBooking. Clique no botão abaixo para escolher uma nova senha:'
                                : 'Recebemos uma solicitação de login ou cadastro para sua conta no PrimeBooking.'}
                        </Text>

                        <Section style={buttonContainer}>
                            <a href={linkHref} style={button}>
                                {isRecovery ? 'Redefinir minha senha' : 'Acessar o sistema'}
                            </a>
                        </Section>


                        <Text style={securityText}>
                            Por segurança, este link expirará em breve. Se você não solicitou esta ação, pode ignorar este e-mail com segurança.
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © 2026 PrimeBooking. Todos os direitos reservados.
                        </Text>
                        <Text style={footerText}>
                            Appsbuilding Service Provider
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

export default MagicLinkEmail

const main = {
    backgroundColor: '#f4f4f5',
    padding: '40px 20px',
}

const container = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    maxWidth: '560px',
    margin: '0 auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
}

const header = {
    backgroundColor: '#2563eb',
    padding: '32px',
    textAlign: 'center' as const,
}

const h1 = {
    color: '#ffffff',
    margin: '0',
    fontSize: '24px',
    fontWeight: '600',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const content = {
    padding: '32px',
}

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
}

const button = {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-block',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const secondaryLink = {
    color: '#6b7280',
    fontSize: '14px',
    wordBreak: 'break-all' as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const securityText = {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '1.6',
    marginTop: '24px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const footer = {
    backgroundColor: '#f9fafb',
    padding: '24px 32px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e5e7eb',
}

const footerText = {
    color: '#9ca3af',
    fontSize: '13px',
    margin: '0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}
