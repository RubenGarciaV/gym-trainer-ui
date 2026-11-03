import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "../../api/client";
import type { AuthSession, AuthUser } from "../../api/types";

interface SessionContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  refreshSession: () => Promise<AuthUser | null>;
  isSessionLoading: boolean;
  sessionError: string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const sessionRevision = useRef(0);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    sessionRevision.current += 1;
    setUserState(nextUser);
    setSessionError("");
  }, []);

  const refreshSession = useCallback(async () => {
    const revision = sessionRevision.current;

    try {
      const session = await apiRequest<AuthSession | null>(
        "/api/auth/get-session",
      );
      const nextUser = session?.user ?? null;

      if (revision === sessionRevision.current) {
        setUserState(nextUser);
        setSessionError("");
      }

      return nextUser;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar la sesión.";
      if (revision === sessionRevision.current) {
        setSessionError(message);
      }
      throw requestError;
    }
  }, []);

  useEffect(() => {
    let active = true;

    refreshSession()
      .catch((requestError: unknown) => {
        console.error("Could not load the current user session.", requestError);
      })
      .finally(() => {
        if (active) setIsSessionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshSession]);

  return (
    <SessionContext.Provider
      value={{ user, setUser, refreshSession, isSessionLoading, sessionError }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider.");
  }
  return context;
};
