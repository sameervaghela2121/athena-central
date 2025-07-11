import { NavLink } from "react-router-dom";

import allImgPaths from "@/assets";
import { ButtonV2, Layout } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { DEFAULT_ADMIN_URL, ROLES } from "@/shared/constants";

const UnAuthorizedAccess = () => {
  const { translate } = useTranslate();
  const {
    imposterUser: { role: imposterRole = "" },
  } = useAppState(RootState.AUTH);

  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(imposterRole);

  return (
    <Layout>
      <div className="flex flex-col gap-y-10 w-full items-center justify-center h-[calc(100vh_-_165px)]">
        <div className="flex flex-col gap-y-7 justify-center items-center">
          <div>
            <img src={allImgPaths.unAuthorizedAccess} alt="" />
          </div>
          <div className="flex flex-col gap-y-4 justify-center items-center">
            <h2 className="text-3xl font-medium text-secondary-900">
              {translate("unAuthorizedAccess.heading")}
            </h2>
            <p className="text-center">
              {translate("unAuthorizedAccess.description1")}
              <br />
              {translate("unAuthorizedAccess.description2")}
            </p>
          </div>
        </div>
        <NavLink to={`${isAdmin ? DEFAULT_ADMIN_URL : "/chats"}`}>
          <ButtonV2>{translate("unAuthorizedAccess.backToHome")}</ButtonV2>
        </NavLink>
      </div>
    </Layout>
  );
};

export default UnAuthorizedAccess;
