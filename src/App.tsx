import gradient from "gradient-string";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { AppStateProvider } from "./context";
import containers from "./context/state";
import Routing from "./routing";

import allImgPaths from "./assets";
import { ErrorBoundary } from "./components";
import { AuthProvider } from "./components/AuthProvider";

import "react-confirm-alert/src/react-confirm-alert.css"; // Import css
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css"; // For the snow theme
import "react-tooltip/dist/react-tooltip.css";
import "./index.css";

function App() {
  const asciiArt = `
 █████╗ ████████╗██╗  ██╗███████╗███╗   ██╗ █████╗ 
██╔══██╗╚══██╔══╝██║  ██║██╔════╝████╗  ██║██╔══██╗
███████║   ██║   ███████║█████╗  ██╔██╗ ██║███████║
██╔══██║   ██║   ██╔══██║██╔══╝  ██║╚██╗██║██╔══██║
██║  ██║   ██║   ██║  ██║███████╗██║ ╚████║██║  ██║
╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝
`;

  console.log(gradient.mind(asciiArt));

  return (
    <AppStateProvider containers={containers}>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routing />
            <Toaster
              icons={{
                success: <img src={allImgPaths.successIcon} />,
                warning: <img src={allImgPaths.warningIcon} />,
                error: <img src={allImgPaths.errorIcon} />,
              }}
              position="top-right"
              richColors
              closeButton
              duration={5000}
            />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </AppStateProvider>
  );
}

export default App;
