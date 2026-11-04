import { useState } from "react";
import { Activity, Clock3, Dumbbell, House, LogOut, Plus, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import { useSession } from "../../hooks/auth/session-context";

const sections = [
  { Icon: House, label: "Inicio", path: "/home" },
  { Icon: Dumbbell, label: "Rutinas", path: "/workouts" },
  { Icon: Plus, label: "Crear", path: "/training" },
  { Icon: Clock3, label: "Historial", path: "/history" },
  { Icon: UserRound, label: "Perfil", path: "/profile" },
];

const Header = () => {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const { user, setUser, isSessionLoading } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await apiRequest<unknown>("/api/auth/sign-out", { method: "POST" });
      setUser(null);
      showAlert("success", "Has cerrado sesión.");
      navigate("/", { replace: true });
    } catch (requestError) {
      showAlert(
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
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-lockup">
          <span aria-hidden="true" className="brand-mark">
            <Activity size={21} strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="brand-name">GYM TRAINER</p>
            <p className="brand-caption">
              {isSessionLoading ? "Tu espacio de entrenamiento" : `Hola, ${user?.name || "bienvenido"}`}
            </p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="desktop-nav">
          {sections.map(({ Icon, label, path }) => (
            <NavLink
              className="desktop-nav-link"
              key={path}
              to={path}
            >
              <Icon aria-hidden="true" size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {!isSessionLoading && user && (
          <button
            aria-label="Cerrar sesión"
            className="logout-button disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={17} />
            <span className="logout-label">
              {isSigningOut ? "Cerrando..." : "Salir"}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
