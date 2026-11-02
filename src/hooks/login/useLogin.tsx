import { useState } from "react";
import { useNavigate } from "react-router";

const username = "admin";
const password = "admin";

interface UserData {
  username: string;
  password: string;
}

interface UseLogin {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  handleLogin: () => void;
  error: boolean;
}

export const useLogin = (): UseLogin => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({ username: "", password: "" });
  const [error, setError] = useState<boolean>(false);

  const handleLogin = () => {
    if (userData.username === username && userData.password === password) {
      navigate("/home");
    } else {
      setError(true);
    }
  };

  return {
    userData,
    setUserData,
    handleLogin,
    error
  }
};
