import useAppState, { RootState } from "@/context/useAppState";
import { ACTION, PAGES } from "@/shared/constants";
import { get } from "lodash-es";
import { useMemo } from "react";

const usePermissions = (page: string): any => {
  const {
    user: { permissions },
  } = useAppState(RootState.AUTH);

  return useMemo(() => {
    switch (page) {
      case PAGES.KNOWLEDGE_ENTRIES:
      case PAGES.GROUPS:
      case PAGES.QUEUES:
      case PAGES.ROLES:
      case PAGES.USERS:
      case PAGES.PLAN_PRICING:
        return {
          canCreate: get(permissions, `${page}[${ACTION.CREATE}]`, false),
          canDelete: get(permissions, `${page}[${ACTION.DELETE}]`, false),
          canRead: get(permissions, `${page}[${ACTION.READ}]`, false),
          canUpdate: get(permissions, `${page}[${ACTION.UPDATE}]`, false),
          // canCreate: true,
          // canDelete: true,
          // canRead: true,
          // canUpdate: true,
        };

      default:
        return {
          canCreate: true,
          canDelete: true,
          canRead: true,
          canUpdate: true,
        };
    }
  }, [permissions]);
};

export default usePermissions;
