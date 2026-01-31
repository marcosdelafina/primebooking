export type ApiResponse<T = any> = {
    data?: T;
    error?: string;
    message?: string;
};

export function createResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { data, message };
}

export function createErrorResponse(error: string): ApiResponse {
    return { error };
}

export async function handleApiCall<T>(promise: Promise<{ data: T; error: any }>): Promise<ApiResponse<T>> {
    try {
        const { data, error } = await promise;
        if (error) return createErrorResponse(error.message || 'Erro desconhecido');
        return createResponse(data);
    } catch (err: any) {
        return createErrorResponse(err.message || 'Erro inesperado');
    }
}
