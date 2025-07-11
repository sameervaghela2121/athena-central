import { useEffect, useRef, useState } from "react";
import AppContext from "./AppContext";

let oldMapOfInstancesStringified: any;

const AppStateProvider = ({
  children,
  containers = {},
}: {
  children: any;
  containers: any;
}) => {
  const [isInitialized, setInitialized] = useState(false);
  const mapOfInstances = useRef<any>({});
  const [updateCount, setUpdateCount] = useState(0);

  const getter = (id: string) => {
    return mapOfInstances.current[id] || {};
  };

  Object.keys(containers).forEach((k) => {
    mapOfInstances.current[k] = containers[k](getter);
  });

  useEffect(() => {
    setInitialized(true);
  }, []);

  const mapOfInstancesSF = JSON.stringify(mapOfInstances.current);

  if (mapOfInstancesSF !== oldMapOfInstancesStringified) {
    setUpdateCount(updateCount + 1);
  }

  oldMapOfInstancesStringified = JSON.stringify(mapOfInstances.current);

  return (
    <AppContext.Provider value={[mapOfInstances.current]}>
      {isInitialized && children}
    </AppContext.Provider>
  );
};

export default AppStateProvider;
