import { useLogin } from "../../hooks/login/useLogin";

const Login = () => {
  const { userData, setUserData, handleLogin, error } = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md border-2 border-sky-800 rounded-lg p-4 text-sky-800 shadow-lg shadow-sky-800">
        <div className="mb-4">
          <label className="mb-2.5 text-lg font-medium text-heading">Username</label>
          <input
            autoComplete="off"
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
            onChange={(e) => setUserData({ ...userData, username: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="mb-2.5 text-lg font-medium text-heading">Password</label>
          <input
            type="password"
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
            onChange={(e) => setUserData({ ...userData, password: e.target.value })}
          />
        </div>
        {error && (
          <div className="mb-2.5 text-sm text-red-600">
            Credentials are not valid.
          </div>
        )}
        <div className="flex justify-end">
          <button className="bg-sky-600 hover:bg-sky-800 text-white font-bold py-2 px-4 rounded cursor-pointer" onClick={() => handleLogin()}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
