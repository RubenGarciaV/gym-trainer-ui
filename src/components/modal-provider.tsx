import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type AlertKind = "success" | "error" | "confirm";

interface ModalMessage {
  kind: AlertKind;
  message: string;
  confirmLabel?: string;
  resolve?: (confirmed: boolean) => void;
}

interface ModalContextValue {
  showAlert: (kind: Exclude<AlertKind, "confirm">, message: string) => void;
  confirmAction: (message: string, confirmLabel?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const AlertModal = ({
  modal,
  onDismiss,
  dialogRef,
}: {
  modal: ModalMessage | null;
  onDismiss: (confirmed: boolean) => void;
  dialogRef: RefObject<HTMLDialogElement | null>;
}) => {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (modal && !dialog.open) {
      dialog.showModal();
    } else if (!modal && dialog.open) {
      dialog.close();
    }
    if (modal) {
      dialog
        .querySelector<HTMLButtonElement>("[data-modal-initial-focus]")
        ?.focus();
    }
  }, [dialogRef, modal]);

  return (
    <dialog
      aria-describedby="alert-modal-message"
      aria-labelledby="alert-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss(false);
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onDismiss(false);
      }}
      ref={dialogRef}
    >
      {modal && (
        <div className="p-6">
          <div className="flex items-start gap-4">
            {modal.kind === "success" ? (
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-emerald-600"
                size={24}
              />
            ) : modal.kind === "error" ? (
              <XCircle
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-red-600"
                size={24}
              />
            ) : (
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-amber-600"
                size={24}
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold" id="alert-modal-title">
                {modal.kind === "success"
                  ? "Operación completada"
                  : modal.kind === "error"
                    ? "Ha ocurrido un error"
                    : "Confirmar acción"}
              </h2>
              <p
                className="mt-2 whitespace-pre-wrap text-sm text-slate-600"
                id="alert-modal-message"
              >
                {modal.message}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {modal.kind === "confirm" && (
              <button
                data-modal-initial-focus={modal.kind === "confirm" || undefined}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => onDismiss(false)}
                type="button"
              >
                Cancelar
              </button>
            )}
            <button
              data-modal-initial-focus={modal.kind !== "confirm" || undefined}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                modal.kind === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : modal.kind === "confirm"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-sky-600 hover:bg-sky-700"
              }`}
              onClick={() => onDismiss(modal.kind === "confirm")}
              type="button"
            >
              {modal.kind === "confirm"
                ? (modal.confirmLabel ?? "Confirmar")
                : "Aceptar"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalMessage | null>(null);
  const modalQueue = useRef<ModalMessage[]>([]);
  const activeModal = useRef<ModalMessage | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const enqueueModal = useCallback((message: ModalMessage) => {
    const nextModal = message;
    if (activeModal.current) {
      modalQueue.current.push(nextModal);
      return;
    }

    activeModal.current = nextModal;
    setModal(nextModal);
  }, []);

  const dismissModal = useCallback((confirmed: boolean) => {
    activeModal.current?.resolve?.(confirmed);
    const nextModal = modalQueue.current.shift() ?? null;
    activeModal.current = nextModal;
    setModal(nextModal);
  }, []);
  const showAlert = useCallback(
    (kind: Exclude<AlertKind, "confirm">, message: string) => {
      enqueueModal({ kind, message });
    },
    [enqueueModal],
  );
  const confirmAction = useCallback(
    (message: string, confirmLabel = "Confirmar") =>
      new Promise<boolean>((resolve) =>
        enqueueModal({ kind: "confirm", message, confirmLabel, resolve }),
      ),
    [enqueueModal],
  );
  const contextValue = useMemo(
    () => ({ showAlert, confirmAction }),
    [confirmAction, showAlert],
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <AlertModal
        dialogRef={dialogRef}
        modal={modal}
        onDismiss={dismissModal}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider.");
  }
  return context;
};
