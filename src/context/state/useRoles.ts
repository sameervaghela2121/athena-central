import { useReducer } from "react";

import api from "@/apis/roles";

import { get } from "lodash-es";

export interface Groups {
  data: any[];
  limit: number;
  page: number;
  total: number;
  isLoading: boolean;
  isDeleting: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isFetching: boolean;
  isFetchingPermission: boolean;
  error: any;
  queueDetail: any;
}

const initialArgs: Groups = {
  data: [],
  limit: 10,
  page: 1,
  total: 0,
  isLoading: true,
  isDeleting: false,
  isCreating: false,
  isUpdating: false,
  isFetching: false,
  isFetchingPermission: false,
  error: false,
  queueDetail: null,
};

function reducer(state: Groups, action: Groups) {
  return { ...state, ...action };
}

const useRoles = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const getRoles = async (query: any, isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const result = await api.fetchRoles(query);

      setState({
        ...state,
        data: result?.result,
        total: get(result, "pagination_info.total_records", 0),
        isLoading: false,
      });

      return result?.result;
    } catch (error) {
      console.error("getRoles error => ", error);
      setState({ ...state, data: [], isLoading: false, error });
    }
  };

  const removeRole = async (id: string) => {
    try {
      setState({ ...state, isDeleting: true });
      const { data } = await api.removeRole(id);

      setState({
        ...state,
        isDeleting: false,
      });
    } catch (error) {
      console.error("getRoles error => ", error);
      setState({ ...state, isDeleting: false, error });
      throw error;
    }
  };

  const fetchRoleById = async (id: string) => {
    try {
      setState({ ...state, isFetching: true });
      const { data } = await api.fetchRoleById(id);

      setState({
        ...state,
        isFetching: false,
      });
      return get(data, "result", {});
    } catch (error) {
      console.error("getRoles error => ", error);
      setState({ ...state, isFetching: false, error });
      throw error;
    }
  };

  const fetchRolePermission = async () => {
    try {
      setState({ ...state, isFetching: true });
      const { data } = await api.fetchRolePermission();

      setState({
        ...state,
        isFetching: false,
      });
      return get(data, "result", {});
    } catch (error) {
      console.error("getRoles error => ", error);
      setState({ ...state, isFetching: false, error });
      throw error;
    }
  };

  const updateRole = async (id: string, payload: { name: string }) => {
    try {
      setState({ ...state, isUpdating: true });
      const { data } = await api.updateRole(id, payload);

      setState({
        ...state,
        isUpdating: false,
      });
      return data;
    } catch (error) {
      console.error("getRoles error => ", error);
      setState({ ...state, isUpdating: false, error });
      throw error;
    }
  };

  const createRole = async (payload: any) => {
    try {
      setState({ ...state, isCreating: true });
      const { data } = await api.createRole(payload);
      setState({
        ...state,
        isCreating: false,
      });

      return data;
    } catch (error) {
      console.error("getRoles error => ", error);
      setState({ ...state, isCreating: false, error });
      throw error;
    }
  };

  return {
    getRoles,
    removeRole,
    fetchRoleById,
    updateRole,
    createRole,
    fetchRolePermission,
    ...state,
  };
};

export type UseRolesReturnType = ReturnType<typeof useRoles>;

export default useRoles;
