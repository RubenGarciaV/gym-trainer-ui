import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/client";
import { useToast } from "../../components/toast-provider";
import { useSession } from "../../hooks/auth/session-context";

const Header = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, setUser, isSessionLoading } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await apiRequest<unknown>("/api/auth/sign-out", { method: "POST" });
      setUser(null);
      showToast("success", "Has cerrado sesión.");
      navigate("/", { replace: true });
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="mb-2 flex items-center justify-between gap-3 border-b border-sky-500 px-4 py-3 text-sky-700">
      <h1 className="text-md font-bold">
        {isSessionLoading ? "Gym Trainer" : user?.name || "Gym Trainer"}
      </h1>
      {!isSessionLoading && user && (
        <button
          aria-label="Cerrar sesión"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSigningOut}
          onClick={handleSignOut}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          <span>{isSigningOut ? "Cerrando..." : "Cerrar sesión"}</span>
        </button>
      )}
    </header>
  );
}

export default Header;
