import { useSession } from "../../hooks/auth/session-context";

const Header = () => {
  const { user, isSessionLoading, sessionError } = useSession();

  return (
    <header className="mb-2 grid justify-center border-b border-sky-500 py-3 text-sky-700">
      <h1 className="text-md font-bold">
        {isSessionLoading ? "Gym Trainer" : user?.name || "Gym Trainer"}
      </h1>
      {sessionError && (
        <p className="sr-only" role="status">
          No se pudo cargar el nombre del usuario: {sessionError}
        </p>
      )}
    </header>
  );
}

export default Header;
