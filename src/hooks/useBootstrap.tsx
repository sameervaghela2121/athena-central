import useAppState, { RootState } from "@/context/useAppState";
import axios from "axios";
import { get } from "lodash-es";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

export const useBootstrap = () => {
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const { fetchUser } = useAppState(RootState.AUTH);
  const { fetchLanguageList } = useAppState(RootState.COMMON);

  const initApp = async () => {
    setIsLoading(true);

    try {
      const result = await fetchUser();
      i18n.changeLanguage(get(result, "preferences.language", "en"));
      setIsLoading(false);
      try {
        await fetchLanguageList();
      } catch (error) {
        console.error("fetchLanguageList error =>", error);
      }
    } catch (error) {
      console.error("initApp error =>", error);

      navigate(`/login${location.search}`);
    } finally {
      // warm up

      if (window.location.hostname.includes("retail")) {
        axios
          .get("https://retail-warm-64110428009.us-central1.run.app/")
          .catch((error) => {
            console.error("initApp warm up API failed =>", error);
          });
      }
    }
  };

  return { initApp, isLoading };
};
