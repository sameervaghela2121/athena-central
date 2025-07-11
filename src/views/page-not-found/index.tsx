import allImgPaths from "@/assets";
import { ButtonV2, Layout } from "@/components";
import { NavLink } from "react-router-dom";

const PageNotFound = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-y-10 w-full items-center justify-center h-[calc(100vh_-_165px)]">
        <div className="flex flex-col items-center justify-center gap-y-7">
          <div>
            <img src={allImgPaths.pageNotFound} alt="" />
          </div>
          <div className="flex flex-col justify-center items-center gap-y-4">
            <h2 className="text-secondary-900 font-medium text-3xl">404</h2>
            <span>Page Not Found</span>
          </div>
        </div>
        <NavLink to="/chats">
          <ButtonV2 rightIcon={allImgPaths.rightArrow}>Home</ButtonV2>
        </NavLink>
      </div>
    </Layout>
  );
};

export default PageNotFound;
