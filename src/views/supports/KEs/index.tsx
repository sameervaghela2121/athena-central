import { lazy } from "react";

import allImgPaths from "@/assets";
import { Layout, Popover } from "@/components";
import { useTranslate } from "@/hooks";

const KEs = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout
      title={
        <div className="flex gap-x-2 items-center">
          <p className="">{translate("KEs.title")}</p>
          <Popover
            position="bottom"
            onHoverOpen={true}
            content={
              <div className="!text-sm w-96">
                Knowledge Entries hold information for the people using the
                chat/search, and are somewhat like a post, but are more
                carefully written than most posts. We use the acronym 'KE' to
                abbreviate it. The collection of KE’s together is the library.
              </div>
            }
            trigger={
              <img
                src={allImgPaths.infoHint}
                alt=""
                className="w-6 h-6 cursor-help"
              />
            }
          ></Popover>
        </div>
      }
    >
      <KEs />
    </Layout>
  );
};

export default index;
