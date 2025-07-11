import { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { useBootstrap } from "@/hooks/useBootstrap";
import { memo, Suspense, useEffect, useState } from "react";
import { ButtonV2 } from "..";
import { useAppState } from "../../context";
import { AnimatedContainerBase } from "../AnimatedContainerBase";
import LoaderCircle from "../LoaderCircle";
import Modal from "../Modal";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = ({
  title = "",
  children,
  header,
  containerClass = "p-7",
}: {
  title?: any;
  children: any;
  containerClass?: string;
  header?: any;
}) => {
  const [showPopup, setShowPopup] = useState(false);

  const { translate } = useTranslate();

  const { showMobileSideBar } = useAppState(RootState.COMMON);
  const { isLoading } = useBootstrap();

  useEffect(() => {
    const pathname = window.location.pathname;
    const isNotChatsRoute =
      pathname.includes("KEs") ||
      pathname.includes("questions") ||
      pathname.includes("queues") ||
      pathname.includes("dashboard") ||
      pathname.includes("plans-billing");
    const maxWidth = isNotChatsRoute ? 480 : 350;

    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);

    const handleScreenSizeChange = (
      event: MediaQueryListEvent | MediaQueryList,
    ) => {
      setShowPopup(event.matches);
    };

    mediaQuery.addEventListener("change", handleScreenSizeChange);
    handleScreenSizeChange(mediaQuery);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenSizeChange);
    };
  }, []);

  const width = 768;
  const height = 581;
  const msgForEditor = `For the best editing experience, we recommend using a device with a larger screen. Our editor is optimized for screens at least ${width} x ${height} pixels, providing ample space for all features and a smoother workflow.`;

  const msgForOther = `Please use a larger screen of at least X x Y pixels.`;
  return (
    <div className="flex relative z-0 w-full h-full transition-colors">
      <div
        className={`flex-shrink-0 overflow-x-hidden max-sm:!w-0 sm:block hidden ${showMobileSideBar && "!block"}`}
      >
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="flex overflow-x-hidden flex-col flex-grow sm:pt-10">
        <header className="sm:px-7 sm:py-0 py-0.5 sm:z-auto p-4">
          {header ? header : <Header title={title} />}
        </header>
        <main className={`flex-grow ${containerClass}`}>
          {isLoading ? (
            <div className="flex justify-center items-center w-full h-full">
              <LoaderCircle />
            </div>
          ) : (
            <AnimatedContainerBase>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center">
                    <LoaderCircle />
                  </div>
                }
              >
                {children}
              </Suspense>
            </AnimatedContainerBase>
          )}
        </main>
      </div>

      <Modal size="sm" show={showPopup} onClose={() => setShowPopup(false)}>
        <div className="flex flex-col gap-y-7">
          <div>
            <p className="text-center">{msgForEditor}</p>
          </div>
          <div className="flex justify-center">
            <ButtonV2
              onClick={() => setShowPopup(false)}
              className="!py-2 !px-6"
            >
              {translate("common.ok")}
            </ButtonV2>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default memo(Layout);
