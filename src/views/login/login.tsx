import { Activity, Eye, EyeOff } from "lucide-react";
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
    <div className="login-screen flex min-h-screen min-h-[100dvh] items-center justify-center p-4 sm:p-8">
      <div className="login-card surface-card w-full max-w-md p-5 text-slate-800 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span aria-hidden="true" className="brand-mark size-12 rounded-2xl">
            <Activity size={24} strokeWidth={2.5} />
          </span>
          <div>
            <p className="brand-name">GYM TRAINER</p>
            <p className="text-xs text-slate-500">Entrena a tu manera</p>
          </div>
        </div>
        <p className="page-eyebrow">
          {isSignUp ? "Empieza hoy" : "Qué bueno verte"}
        </p>
        <h1 className="page-title">
          {isSignUp ? "Crea tu cuenta" : "Entrena con propósito"}
        </h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-slate-500">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
                className="w-full rounded-xl border border-slate-300 px-3 py-3 pr-12 text-base focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-700"
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
            className="min-h-12 w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="min-h-10 rounded-lg px-1 font-semibold text-sky-700 hover:text-sky-800"
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
