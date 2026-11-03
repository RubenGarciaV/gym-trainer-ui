import { Clock, Dumbbell, House, Plus, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const sections = [
  { Icon: House, label: "Home", path: "/home" },
  { Icon: Dumbbell, label: "Workouts", path: "/workouts" },
  { Icon: Plus, label: "Training", path: "/training" },
  { Icon: Clock, label: "History", path: "/history" },
  { Icon: User, label: "Profile", path: "/profile" },
];

const Footer = () => (
  <footer className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-sky-100 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
    {sections.map(({ Icon, label, path }) => (
      <NavLink
        aria-label={label}
        className={({ isActive }) =>
          `flex min-w-14 flex-col items-center gap-1 rounded-md px-2 py-1 text-xs ${
            isActive ? "font-semibold text-sky-700" : "text-slate-500"
          }`
        }
        key={path}
        to={path}
      >
        <Icon aria-hidden="true" size={20} />
        <span>{label}</span>
      </NavLink>
    ))}
  </footer>
);

export default Footer;
