import { lazy, useEffect } from "react";

import allImgPaths from "@/assets";
import { Layout, SwitchCompany } from "@/components";
import { useTranslate } from "@/hooks";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const Chats = lazy(() => import("./main"));

const index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { translate } = useTranslate();

  const [searchParams, setSearchParams] = useSearchParams();

  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("q");
  const canReturn = queryParams.has("canReturn");
  const page = parseInt(queryParams.get("page") ?? "");

  useEffect(() => {
    const updatedParams = new URLSearchParams(searchParams); // Clone current parameters

    if (page) {
      setSearchParams(updatedParams); // Update the URL with the new parameters
      updatedParams.set("page", `${page}`); // Update the `index`
    } else {
      updatedParams.delete("page"); // Update the `index`
    }
  }, [page]);

  const isHistory = query === "history";

  return (
    <Layout
      title={
        isHistory ? (
          <div className="flex items-center gap-x-1">
            {canReturn && (
              <div
                className="p-2 duration-200 rounded-full cursor-pointer hover:bg-secondary-200"
                onClick={() => navigate(`/questions?page=${page}`)}
              >
                <img
                  src={allImgPaths.rightArrowGrayIcon}
                  alt=""
                  className="rotate-180"
                />
              </div>
            )}
            <span>{translate("chats.chatHistory")}</span>
          </div>
        ) : (
          translate("sidebar.chats")
        )
      }
      // header={
      //   <div className="flex justify-between items-center w-full">
      //     <div className="flex items-center gap-x-1">
      //       {isHistory ? (
      //         <>
      //           {canReturn && (
      //             <div
      //               className="p-2 duration-200 rounded-full cursor-pointer hover:bg-secondary-200"
      //               onClick={() => navigate(`/questions?page=${page}`)}
      //             >
      //               <img
      //                 src={allImgPaths.rightArrowGrayIcon}
      //                 alt=""
      //                 className="rotate-180"
      //               />
      //             </div>
      //           )}
      //           <span className="text-sm font-black sm:text-2xl text-primary-900">
      //             {translate("chats.chatHistory")}
      //           </span>
      //         </>
      //       ) : (
      //         <span className="text-sm font-black sm:text-2xl text-primary-900">
      //           {translate("sidebar.chats")}
      //         </span>
      //       )}
      //     </div>
      //     <SwitchCompany className="ml-auto" />
      //   </div>
      // }
      containerClass="p-0"
    >
      <Chats history={isHistory} />
    </Layout>
  );
};

export default index;
