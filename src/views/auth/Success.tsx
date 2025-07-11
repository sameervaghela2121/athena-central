import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { useBootstrap } from "@/hooks/useBootstrap";
import { TOKEN_KEY_NAME } from "@/shared/constants";

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { translate } = useTranslate();

  const { initApp, isLoading } = useBootstrap();

  const { isLoggedIn } = useAppState(RootState.AUTH);

  const queryParams = new URLSearchParams(location.search);

  useEffect(() => {
    const token: string = queryParams.get("token") as string;
    localStorage.setItem(TOKEN_KEY_NAME, token ?? "");
    if (!isLoading) {
      initApp();
    }
  }, [queryParams, isLoading]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/chats");
    }
  }, [isLoggedIn]);

  return <div>{translate("common.loading")}</div>;
};

export default Success;
