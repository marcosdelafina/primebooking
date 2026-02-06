import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/types/entities';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  impersonateCompany: (companyId: string) => void;
  resetImpersonation: () => void;
}

interface SignUpData {
  nome: string;
  nomeEstabelecimento: string;
  email: string;
  telefone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [originalUser, setOriginalUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string, metadata?: any) => {
    // 1. Check if user is a client (end-customer)
    const isClient = metadata?.is_client === true || metadata?.is_client === 'true';

    if (isClient) {
      const clientUser: AuthUser = {
        id: userId,
        email: email,
        nome: metadata?.nome || metadata?.full_name || email.split('@')[0],
        is_admin_global: false,
        is_client: true
      };
      setUser(clientUser);
      setOriginalUser(clientUser);
      setIsLoading(false);
      return;
    }

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .rpc('get_user_profile', { p_user_id: userId });

        if (error || !data) {
          if ((!data || error?.code === 'PGRST116') && retries > 1) {
            console.warn(`Profile not found for ${userId}, retrying in ${delay}ms... (${retries - 1} left)`);

            // Try to repair on the first failure
            if (retries === 3) {
              console.info(`Attempting to repair user profile for ${userId}...`);
              await supabase.rpc('debug_and_repair_user', { p_user_id: userId });
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            delay *= 2;
            continue;
          }
          throw error;
        }

        const authUser: AuthUser = {
          id: data.id,
          email: email,
          nome: data.nome,
          empresa_id: data.empresa_id,
          role: data.role,
          is_admin_global: data.is_admin_global,
        };

        setUser(authUser);
        setOriginalUser(authUser);
        setIsLoading(false);
        return; // Success
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (retries <= 1) {
          setUser(null);
        }
      }
      retries--;
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            full_name: data.nome,
            whatsapp: data.telefone,
            nome_estabelecimento: data.nomeEstabelecimento,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const impersonateCompany = useCallback((companyId: string) => {
    if (originalUser?.is_admin_global) {
      setUser(prev => prev ? { ...prev, empresa_id: companyId } : null);
    }
  }, [originalUser]);

  const resetImpersonation = useCallback(() => {
    setUser(originalUser);
  }, [originalUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signUp,
        signInWithGoogle,
        impersonateCompany,
        resetImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

