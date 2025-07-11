import useAppState, { RootState } from "@/context/useAppState";
import { useBootstrap } from "@/hooks/useBootstrap";
import React, { createContext, useContext, useEffect } from "react";

interface AuthContextType {
  role: string;
  imposterRole: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    user: { role = "" },
    imposterUser: { role: imposterRole },
    isLoading,
  } = useAppState(RootState.AUTH);

  const { initApp } = useBootstrap();

  useEffect(() => {
    initApp();
  }, []);

  return (
    <AuthContext.Provider value={{ role, imposterRole }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within a AuthProvider");
  return context;
};
