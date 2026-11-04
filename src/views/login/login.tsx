import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/auth/useAuth";

const Login = () => {
  const {
    mode,
    setMode,
    userData,
    setUserData,
    handleSubmit,
    isLoading,
  } = useAuth();
  const isSignUp = mode === "sign-up";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-800 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-sky-800">
          {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          {isSignUp
            ? "Regístrate para empezar a seguir tus entrenamientos."
            : "Accede a tu cuenta de Gym Trainer."}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignUp && (
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="name">
                Nombre
              </label>
              <input
                autoComplete="name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                id="name"
                name="name"
                onChange={(event) =>
                  setUserData({ ...userData, name: event.target.value })
                }
                required
                value={userData.name}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
              id="email"
              name="email"
              onChange={(event) =>
                setUserData({ ...userData, email: event.target.value })
              }
              required
              type="email"
              value={userData.email}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                id="password"
                name="password"
                onChange={(event) =>
                  setUserData({ ...userData, password: event.target.value })
                }
                minLength={isSignUp ? 8 : undefined}
                required
                type={isPasswordVisible ? "text" : "password"}
                value={userData.password}
              />
              <button
                aria-label={
                  isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={isPasswordVisible}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                type="button"
              >
                {isPasswordVisible ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            className="w-full rounded-md bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading
              ? "Procesando..."
              : isSignUp
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isSignUp ? "¿Ya tienes cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
          <button
            className="font-semibold text-sky-700 hover:text-sky-800"
            disabled={isLoading}
            onClick={() => {
              setMode(isSignUp ? "sign-in" : "sign-up");
            }}
            type="button"
          >
            {isSignUp ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
