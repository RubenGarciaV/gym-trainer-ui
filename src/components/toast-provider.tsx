import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error";

interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) => {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), 4000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id]);

  const isSuccess = toast.kind === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div
      className={`flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg ${
        isSuccess
          ? "border-emerald-200 bg-white text-emerald-900"
          : "border-red-200 bg-white text-red-900"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      <Icon
        aria-hidden="true"
        className={isSuccess ? "text-emerald-600" : "text-red-600"}
        size={20}
      />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        aria-label="Cerrar notificación"
        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-label="Notificaciones"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:w-96 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div className="pointer-events-auto w-full" key={toast.id}>
            <ToastItem onDismiss={dismissToast} toast={toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context.showToast;
};
