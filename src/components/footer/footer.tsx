import { Clock, Dumbbell, House, Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  const buildSection = (Icon: any, label: string, path: string) => {
    return (
      <div
        className="flex flex-col items-center text-sm cursor-pointer"
        onClick={() => handleNavigation(`/${path}`)}
      >
        <Icon />
        <span>{label}</span>
      </div>
    );
  };

  return (
    <footer className="fixed inset-x-0 bottom-0 z-10 flex justify-between bg-sky-100 p-3">
      {buildSection(House, "Home", "home")}
      {buildSection(Dumbbell, "Workouts", "workouts")}
      {buildSection(Plus, "Training", "training")}
      {buildSection(Clock, "History", "history")}
      {buildSection(User, "Profile", "profile")}
    </footer>
  );
}

export default Footer;
