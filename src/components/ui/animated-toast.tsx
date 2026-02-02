import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info" | "whatsapp";

export interface AnimatedToast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
    customIcon?: React.ReactNode;
    persistent?: boolean;
}

interface AnimatedToastContextType {
    toasts: AnimatedToast[];
    addToast: (toast: Omit<AnimatedToast, "id"> & { id?: string }) => void;
    removeToast: (id: string) => void;
}

const AnimatedToastContext = React.createContext<AnimatedToastContextType | undefined>(undefined);

export const useAnimatedToast = () => {
    const context = React.useContext(AnimatedToastContext);
    if (!context) {
        throw new Error("useAnimatedToast must be used within AnimatedToastProvider");
    }
    return context;
};

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
    success: {
        bg: "bg-emerald-950/95",
        border: "border-emerald-500/30",
        icon: CheckCircle,
        iconColor: "text-emerald-400",
    },
    error: {
        bg: "bg-red-950/95",
        border: "border-red-500/30",
        icon: AlertCircle,
        iconColor: "text-red-400",
    },
    warning: {
        bg: "bg-amber-950/95",
        border: "border-amber-500/30",
        icon: AlertTriangle,
        iconColor: "text-amber-400",
    },
    info: {
        bg: "bg-blue-950/95",
        border: "border-blue-500/30",
        icon: Info,
        iconColor: "text-blue-400",
    },
    whatsapp: {
        bg: "bg-emerald-950/95",
        border: "border-emerald-500/30",
        icon: WhatsAppIcon,
        iconColor: "text-[#25D366]",
    },
};

const ToastItem = React.forwardRef<
    HTMLDivElement,
    {
        toast: AnimatedToast;
        onRemove: (id: string) => void;
    }
>(({ toast, onRemove }, ref) => {
    const style = toastStyles[toast.type];
    const Icon = style.icon;

    // Auto-dismiss logic
    React.useEffect(() => {
        if (toast.persistent) return;
        if (!toast.duration || toast.duration <= 0) return;

        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, toast.persistent, onRemove]);

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, x: 100, rotate: 0 }}
            animate={{
                opacity: 1,
                x: 0,
                rotate: -2,
                transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                }
            }}
            exit={{
                opacity: 0,
                x: 100,
                rotate: 0,
                transition: { duration: 0.2, ease: "easeIn" }
            }}
            whileHover={{ rotate: 0, scale: 1.02 }}
            className={cn(
                "relative flex items-start gap-3 p-4 pr-10 rounded-xl border shadow-2xl backdrop-blur-sm pointer-events-auto",
                "min-w-[280px] max-w-[380px]",
                style.bg,
                style.border
            )}
        >
            <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", style.iconColor)} />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description && (
                    <p className="text-sm text-gray-300 mt-0.5">{toast.description}</p>
                )}
            </div>

            {!toast.persistent && (
                <button
                    onClick={() => onRemove(toast.id)}
                    className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </motion.div>
    );
});
ToastItem.displayName = "ToastItem";

export const AnimatedToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = React.useState<AnimatedToast[]>([]);

    const addToast = React.useCallback((toast: Omit<AnimatedToast, "id"> & { id?: string }) => {
        const id = toast.id || Math.random().toString(36).substring(2, 9);

        // Rule: Auto-dismiss everywhere EXCEPT landing page
        const isLandingPage = window.location.pathname === "/book" || window.location.pathname === "/";
        const defaultDuration = isLandingPage ? undefined : 3000;

        setToasts((prev) => {
            if (prev.some(t => t.id === id)) {
                return prev;
            }

            // Ensure we have a valid duration if not persistent
            let finalDuration = toast.duration;
            if (!toast.persistent && (finalDuration === undefined || finalDuration === null)) {
                finalDuration = defaultDuration;
            }

            return [...prev, { ...toast, duration: finalDuration, id }];
        });
    }, []);

    // Register toast function for external usage
    React.useEffect(() => {
        setToastFunction(addToast);
    }, [addToast]);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <AnimatedToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <div className="fixed top-24 right-4 z-[999999] flex flex-col gap-3 max-sm:left-4 max-sm:right-4 max-sm:top-20 max-sm:items-center pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </AnimatedToastContext.Provider>
    );
};

// Convenience function for external use
let toastFn: ((toast: Omit<AnimatedToast, "id"> & { id?: string }) => void) | null = null;

export const setToastFunction = (fn: (toast: Omit<AnimatedToast, "id"> & { id?: string }) => void) => {
    toastFn = fn;
};

export const animatedToast = {
    success: (title: string, description?: string, duration?: number) =>
        toastFn?.({ type: "success", title, description, duration }),
    error: (title: string, description?: string, duration?: number) =>
        toastFn?.({ type: "error", title, description, duration }),
    warning: (title: string, description?: string, duration?: number) =>
        toastFn?.({ type: "warning", title, description, duration }),
    info: (title: string, description?: string, duration?: number) =>
        toastFn?.({ type: "info", title, description, duration }),
};
