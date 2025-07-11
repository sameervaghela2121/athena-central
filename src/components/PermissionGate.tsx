import React, { memo, ReactNode } from "react";

import useAppState, { RootState } from "@/context/useAppState";
import { PAGES } from "@/shared/constants";
import LoaderCircle from "./LoaderCircle";

interface PermissionGateProps {
  page: PAGES;
  action: string;
  children: ReactNode;
  errorComponent?: ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  page,
  action,
  children,
  errorComponent = null,
}) => {
  const {
    user: { permissions = {} },
    isLoading: isBootstrapping,
  } = useAppState(RootState.AUTH);

  if (isBootstrapping) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <LoaderCircle text="Initializing App..." />
      </div>
    );
  }

  const _permissions: any = permissions;

  const hasPermission = _permissions[page]?.[action] ?? false;

  return hasPermission ? <>{children}</> : errorComponent;
};

export default memo(PermissionGate);
