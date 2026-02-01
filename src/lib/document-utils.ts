/**
 * Utilitários para validação e formatação de documentos (CPF/CNPJ)
 * Inclui suporte ao novo padrão de CNPJ alfanumérico (julho/2026).
 */

/**
 * Converte caractere alfanumérico do CNPJ para seu valor numérico correspondente.
 * Regra: Código ASCII - 48.
 * Números 0-9 -> 0-9 (ASCII 48-57)
 * Letras A-Z -> 17-42 (ASCII 65-90)
 */
const charToWeight = (char: string): number => {
    const code = char.toUpperCase().charCodeAt(0);
    return code - 48;
};

/**
 * Valida CNPJ (Numérico ou Alfanumérico)
 * Baseado na regra do Módulo 11 da Receita Federal.
 */
export const validateCNPJ = (cnpj: string): boolean => {
    const cleanCnpj = cnpj.replace(/[^\w]/g, '').toUpperCase();

    // CNPJ deve ter 14 caracteres e não pode ter todos os caracteres iguais
    if (cleanCnpj.length !== 14 || /^(\w)\1+$/.test(cleanCnpj)) return false;

    const root = cleanCnpj.substring(0, 12);
    const dv = cleanCnpj.substring(12, 14);

    // Cálculo do DV1 (13º dígito)
    // Pesos: 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1 = 0;
    for (let i = 0; i < 12; i++) {
        sum1 += charToWeight(root[i]) * weights1[i];
    }
    const rest1 = sum1 % 11;
    const expectedDV1 = rest1 < 2 ? 0 : 11 - rest1;

    if (parseInt(dv[0]) !== expectedDV1) return false;

    // Cálculo do DV2 (14º dígito)
    // Pesos: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;
    const rootWithDV1 = root + expectedDV1;
    for (let i = 0; i < 13; i++) {
        sum2 += charToWeight(rootWithDV1[i]) * weights2[i];
    }
    const rest2 = sum2 % 11;
    const expectedDV2 = rest2 < 2 ? 0 : 11 - rest2;

    return parseInt(dv[1]) === expectedDV2;
};

/**
 * Valida CPF
 * Baseado na regra do Módulo 11.
 */
export const validateCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');

    // CPF deve ter 11 dígitos e não pode ter todos os números iguais
    if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) return false;

    // Primeiro DV
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpf[i]) * (10 - i);
    }
    let rest = sum % 11;
    let dv1 = rest < 2 ? 0 : 11 - rest;
    if (parseInt(cleanCpf[9]) !== dv1) return false;

    // Segundo DV
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpf[i]) * (11 - i);
    }
    rest = sum % 11;
    let dv2 = rest < 2 ? 0 : 11 - rest;
    return parseInt(cleanCpf[10]) === dv2;
};

/**
 * Formata documento (CPF ou CNPJ) com máscara
 */
export const formatDocument = (value: string): string => {
    const clean = value.replace(/[^\w]/g, '').toUpperCase();

    if (clean.length <= 11) {
        // Máscara CPF: 000.000.000-00
        return clean
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .substring(0, 14);
    } else {
        // Máscara CNPJ: 00.000.000/0000-00 (suporta letras no novo padrão)
        return clean
            .replace(/([\w]{2})([\w])/, '$1.$2')
            .replace(/([\w]{3})([\w])/, '$1.$2')
            .replace(/([\w]{3})([\w])/, '$1/$2')
            .replace(/([\w]{4})([\w]{1,2})/, '$1-$2')
            .substring(0, 18);
    }
};
/**
 * Formata CEP (00000-000)
 */
export const formatCEP = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    return clean
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 9);
};

/**
 * Formata valor para moeda (BRL)
 * Recebe string '12345' e retorna '123,45'
 */
export const formatCurrency = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '0,00';

    const number = parseInt(clean) / 100;
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
};

/**
 * Converte string formatada (1.234,56) para número (1234.56)
 */
export const parseCurrency = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const clean = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
};
