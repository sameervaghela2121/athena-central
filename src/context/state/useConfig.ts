import { useReducer } from "react";

import api from "@/apis/configuration";

export interface Groups {
  data: any[];
  isLoading: boolean;
  isDeleting: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isFetching: boolean;
  error: any;
}

const initialArgs: Groups = {
  data: [],
  isLoading: true,
  isDeleting: false,
  isCreating: false,
  isUpdating: false,
  isFetching: false,
  error: false,
};

function reducer(state: Groups, action: Groups) {
  return { ...state, ...action };
}

const useConfig = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const getConfig = async (isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const result: any = await api.fetchConfig();

      setState({
        ...state,
        data: result,
        isLoading: false,
      });

      return result;
    } catch (error) {
      console.error("getConfig error => ", error);
      setState({ ...state, data: [], isLoading: false, error });
      throw error;
    }
  };

  const getConfigById = async (id: string) => {
    try {
      setState({ ...state, isFetching: true });
      const result: any = await api.fetchConfigById(id);

      setState({
        ...state,
        isFetching: false,
      });

      return result;
    } catch (error) {
      console.error("getConfig error => ", error);
      setState({ ...state, data: [], isFetching: false, error });
      throw error;
    }
  };

  const removeConfig = async (id: string) => {
    try {
      setState({ ...state, isDeleting: true });
      const data = await api.removeConfig(id);

      setState({
        ...state,
        isDeleting: false,
      });
    } catch (error) {
      console.error("removeConfig error => ", error);
      setState({ ...state, isDeleting: false, error });
      throw error;
    }
  };

  const updateConfig = async (id: string, payload: { name: string }) => {
    try {
      setState({ ...state, isUpdating: true });
      const data = await api.updateConfig(id, payload);

      setState({
        ...state,
        isUpdating: false,
      });
      return data;
    } catch (error) {
      console.error("updateConfig error => ", error);
      setState({ ...state, isUpdating: false, error });
      throw error;
    }
  };

  const createAttribute = async (payload: any) => {
    try {
      setState({ ...state, isCreating: true });
      const data = await api.createAttribute(payload);
      setState({
        ...state,
        isCreating: false,
      });

      return data;
    } catch (error) {
      console.error("createAttribute error => ", error);
      setState({ ...state, isCreating: false, error });
      throw error;
    }
  };

  return {
    getConfig,
    getConfigById,
    removeConfig,
    updateConfig,
    createAttribute,
    ...state,
  };
};

export type UseConfigReturnType = ReturnType<typeof useConfig>;

export default useConfig;
