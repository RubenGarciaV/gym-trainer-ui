import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, jsonRequest } from "../../api/client";
import type { AuthUser } from "../../api/types";
import { useSession } from "./session-context";

interface UserData {
  name: string;
  email: string;
  password: string;
}

type AuthMode = "sign-in" | "sign-up";

interface UseAuth {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export const useAuth = (): UseAuth => {
  const navigate = useNavigate();
  const { setUser } = useSession();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const changeMode = (nextMode: AuthMode) => {
    setError("");
    setMode(nextMode);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await apiRequest<{ user: AuthUser }>(
        `/api/auth/${mode}/email`,
        jsonRequest(
          "POST",
          mode === "sign-up"
            ? userData
            : { email: userData.email, password: userData.password },
        ),
      );

      setUser(result.user);
      navigate("/home");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo conectar con el servidor. Inténtalo de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode,
    setMode: changeMode,
    userData,
    setUserData,
    handleSubmit,
    isLoading,
    error,
  };
};
