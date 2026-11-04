import { Clock3, Dumbbell, House, Plus, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const sections = [
  { Icon: House, label: "Inicio", path: "/home" },
  { Icon: Dumbbell, label: "Rutinas", path: "/workouts" },
  { Icon: Plus, label: "Crear", path: "/training", emphasized: true },
  { Icon: Clock3, label: "Historial", path: "/history" },
  { Icon: UserRound, label: "Perfil", path: "/profile" },
];

const Footer = () => (
  <nav aria-label="Navegación principal" className="mobile-nav">
    {sections.map(({ Icon, label, path, emphasized }) => (
      <NavLink
        className={`mobile-nav-link ${emphasized ? "mobile-nav-link-create" : ""}`}
        key={path}
        to={path}
      >
        <Icon aria-hidden="true" size={20} strokeWidth={2.2} />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default Footer;
