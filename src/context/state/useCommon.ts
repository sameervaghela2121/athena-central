import api from "@/apis/axiosInterceptor";
import { HOST } from "@/shared/constants";
import { getCookie } from "@/shared/functions";
import { get, startCase, toLower } from "lodash-es";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
interface Global {
  isDarkTheme: string;
  lang: string;
  languagesList: any[];
  isLoadingLanguages: boolean;
  sidebarCollapse: boolean;
  showBulkGuide: boolean;
  showKEGuide: boolean;
  showLostInternet: boolean | undefined;
  mobileSidebarOpen: boolean;
}
const initialArgs: Global = {
  isDarkTheme: localStorage.getItem("theme") || "light",
  lang: "en",
  showBulkGuide: getCookie("showBulkGuide") !== "hide",
  showKEGuide: getCookie("showKEGuide") !== "hide",
  sidebarCollapse: localStorage.getItem("sidebarCollapse") === "true",
  mobileSidebarOpen: localStorage.getItem("mobileSidebarOpen") === "true",
  languagesList: [],
  isLoadingLanguages: false,
  showLostInternet: undefined,
};

type Action =
  | { type: "SET_LANGUAGES"; payload: any[] }
  | { type: "SET_LANGUAGES_LOADING"; payload: boolean }
  | { type: "SET_LOST_INTERNET"; payload: boolean | undefined }
  | { type: "SET_MOBILE_SIDEBAR"; payload: boolean }
  | { type: "SET_DARK_THEME"; payload: string }
  | { type: "SET_SIDEBAR_COLLAPSE"; payload: boolean }
  | { type: "SET_BULK_GUIDE"; payload: boolean }
  | { type: "SET_KE_GUIDE"; payload: boolean }
  | { type: "SET_STATE"; payload: any };

const reducer = (state: Global, action: Action): Global => {
  switch (action.type) {
    case "SET_LANGUAGES":
      return {
        ...state,
        languagesList: action.payload,
        isLoadingLanguages: false,
      };
    case "SET_LANGUAGES_LOADING":
      return { ...state, isLoadingLanguages: action.payload };
    case "SET_LOST_INTERNET":
      return { ...state, showLostInternet: action.payload };
    case "SET_MOBILE_SIDEBAR":
      return { ...state, mobileSidebarOpen: action.payload };
    case "SET_DARK_THEME":
      return { ...state, isDarkTheme: action.payload };
    case "SET_SIDEBAR_COLLAPSE":
      return { ...state, sidebarCollapse: action.payload };
    case "SET_BULK_GUIDE":
      return { ...state, showBulkGuide: action.payload };
    case "SET_KE_GUIDE":
      return { ...state, showKEGuide: action.payload };
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const useGlobal = () => {
  const [state, setState] = useReducer(reducer, initialArgs);
  const { i18n } = useTranslation();
  const [showMobileSideBar, setShowMobileSideBar] = useState(
    initialArgs.mobileSidebarOpen,
  );

  /**
   * The `toggleTheme` function toggles between dark and light themes and updates the theme state
   * accordingly.
   */
  const toggleTheme = () => {
    localStorage.setItem(
      "theme",
      state.isDarkTheme === "dark" ? "light" : "dark",
    );

    setState({
      type: "SET_DARK_THEME",
      payload: state.isDarkTheme === "dark" ? "light" : "dark",
    });
  };
  const updateState = (payload: any) => {
    setState({ type: "SET_STATE", payload });
  };

  const fetchLanguageList = async () => {
    try {
      setState({ type: "SET_LANGUAGES_LOADING", payload: true });
      const { data } = await api.get(`${HOST.QUEUES}/queues/languages`);
      const result = get(data, "data.result", []).map((lang: any) => ({
        label: startCase(toLower(lang.label)),
        value: lang.value,
      }));

      setState({ type: "SET_LANGUAGES", payload: result });
      return result;
    } catch (error) {
      console.error("error =>", error);
    } finally {
      setState({ type: "SET_LANGUAGES_LOADING", payload: false });
    }
  };
  const toggleInternetLostModal = (showLostInternet: boolean | undefined) => {
    setState({ type: "SET_LOST_INTERNET", payload: showLostInternet });
  };

  const toggleSidebar = (isOpen: boolean) => {
    localStorage.setItem("sidebarCollapse", isOpen.toString());
    setState({ type: "SET_SIDEBAR_COLLAPSE", payload: isOpen });
  };

  /**
   * Toggles the mobile sidebar and persists the state in localStorage
   * @param isOpen - Optional boolean to explicitly set the state
   */
  const toggleMobileSideBar = (isOpen?: boolean) => {
    let newState: boolean;

    if (isOpen !== undefined) {
      newState = isOpen;
    } else {
      newState = !showMobileSideBar;
    }

    // Update the state
    setShowMobileSideBar(newState);

    // Persist in localStorage
    localStorage.setItem("mobileSidebarOpen", newState.toString());

    // Update the global state
    setState({ type: "SET_MOBILE_SIDEBAR", payload: newState });
  };
  return {
    updateState,
    toggleTheme,
    toggleSidebar,
    toggleInternetLostModal,
    showMobileSideBar,
    setShowMobileSideBar,
    toggleMobileSideBar,
    fetchLanguageList,
    ...state,
  };
};
export type UseGlobalReturnType = ReturnType<typeof useGlobal>;
export default useGlobal;
