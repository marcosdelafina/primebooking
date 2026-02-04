import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AnimatedToastProvider } from "@/components/ui/animated-toast";

// Landing Pages
import LandingPage from "@/pages/landing/LandingPage";
import PrivacyPolicy from "@/pages/landing/PrivacyPolicy";
import TermsOfService from "@/pages/landing/TermsOfService";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyOTPPage from "@/pages/auth/VerifyOTPPage";
import AuthConfirmPage from "@/pages/auth/AuthConfirmPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ServicesPage from "@/pages/admin/ServicesPage";
import ProfessionalsPage from "@/pages/admin/ProfessionalsPage";
import EnterpriseSettingsPage from "@/pages/admin/EnterpriseSettingsPage";
import ClientsPage from "@/pages/admin/ClientsPage";
import AppointmentsPage from "@/pages/admin/AppointmentsPage";
import GoogleCallback from "@/pages/admin/GoogleCallback";
import GlobalAdminDashboard from "@/pages/admin/GlobalAdminDashboard";
import MinhaAssinatura from "@/pages/admin/MinhaAssinatura";
import AdminReviewsPage from "@/pages/admin/AdminReviewsPage";
import GlobalPlanosPage from "@/pages/admin/GlobalPlanosPage";
import CategoriesManagementPage from "@/pages/admin/CategoriesManagementPage";

// Client Pages
import ClientExplorePage from "@/pages/client/ClientExplorePage";
import BusinessDetailPage from "@/pages/client/BusinessDetailPage";

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-primary">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-primary">Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<ClientExplorePage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<PublicRoute><VerifyOTPPage /></PublicRoute>} />
      <Route path="/auth/confirm" element={<AuthConfirmPage />} />
      <Route path="/reset-password" element={<ProtectedRoute><ResetPasswordPage /></ProtectedRoute>} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/global" element={<ProtectedRoute><GlobalAdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/global/planos" element={<ProtectedRoute><GlobalPlanosPage /></ProtectedRoute>} />
      <Route path="/admin/global/categories" element={<ProtectedRoute><CategoriesManagementPage /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
      <Route path="/admin/services/new" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
      <Route path="/admin/services/:id" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
      <Route path="/admin/professionals" element={<ProtectedRoute><ProfessionalsPage /></ProtectedRoute>} />
      <Route path="/admin/professionals/new" element={<ProtectedRoute><ProfessionalsPage /></ProtectedRoute>} />
      <Route path="/admin/professionals/:id" element={<ProtectedRoute><ProfessionalsPage /></ProtectedRoute>} />

      {/* Placeholder routes */}
      <Route path="/admin/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/admin/appointments/new" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><EnterpriseSettingsPage /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewsPage /></ProtectedRoute>} />
      <Route path="/admin/subscription" element={<ProtectedRoute><MinhaAssinatura /></ProtectedRoute>} />
      <Route path="/admin/google-callback" element={<GoogleCallback />} />

      {/* Client Booking Routes (Public) */}
      <Route path="/book" element={<Navigate to="/" replace />} />
      <Route path="/book/:slug" element={<BusinessDetailPage />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="primebooking-theme" attribute="class">
      <AuthProvider>
        <TooltipProvider>
          <AnimatedToastProvider>
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppRoutes />
            </BrowserRouter>
          </AnimatedToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

