import { useLocation, useParams } from "react-router-dom";

const useBasePath = () => {
  const location = useLocation();
  const params = useParams<Record<string, string>>();

  return Object.values(params).reduce(
    (path: any, param) => path.replace("/" + param, ""),
    location.pathname,
  );
};

export default useBasePath;
