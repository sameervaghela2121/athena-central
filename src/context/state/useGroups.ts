import { useReducer } from "react";

import api from "@/apis/groups";

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
  isFetchingGroupAttribute: boolean;
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
  isFetchingGroupAttribute: false,
  error: false,
  queueDetail: null,
};

function reducer(state: Groups, action: Groups) {
  return { ...state, ...action };
}

const useGroups = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const getGroups = async (query = "", isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const data = await api.fetchGroups(query);
      setState({
        ...state,
        data: get(data, "result", []),
        total: get(data, "pagination_info.total_records", 0),
        isLoading: false,
      });

      return get(data, "result", []);
    } catch (error) {
      console.error("getGroups error => ", error);
      setState({ ...state, data: [], isLoading: false, error });
    }
  };

  const removeGroup = async (id: string) => {
    try {
      setState({ ...state, isDeleting: true });
      const { data } = await api.removeGroup(id);

      setState({
        ...state,
        isDeleting: false,
      });
    } catch (error) {
      console.error("getGroups error => ", error);
      setState({ ...state, isDeleting: false, error });
      throw error;
    }
  };

  const fetchGroupById = async (id: string) => {
    try {
      setState({ ...state, isFetching: true });
      const { data } = await api.fetchGroupById(id);

      setState({
        ...state,
        isFetching: false,
      });

      return get(data, "data.result[0]", {});
    } catch (error) {
      console.error("getGroups error => ", error);
      setState({ ...state, isFetching: false, error });
    }
  };

  const updateGroup = async (
    id: string,
    payload: { name: string; description: string; users: any[] },
  ) => {
    try {
      setState({ ...state, isUpdating: true });
      const { data } = await api.updateGroup(id, payload);

      setState({
        ...state,
        isUpdating: false,
      });
      return get(data, "data", {});
    } catch (error) {
      console.error("getGroups error => ", error);
      setState({ ...state, isUpdating: false, error });
      throw error;
    }
  };

  const fetchGroupAttribute = async () => {
    try {
      setState({ ...state, isFetchingGroupAttribute: true });
      const { result } = await api.fetchGroupAttribute();

      setState({
        ...state,
        isFetchingGroupAttribute: false,
      });
      return result;
    } catch (error) {
      console.error("getGroups error => ", error);
      setState({ ...state, isFetchingGroupAttribute: false, error });
      throw error;
    }
  };

  const createGroup = async (payload: any) => {
    try {
      setState({ ...state, isCreating: true });
      const { data } = await api.createGroup(payload);
      setState({
        ...state,
        isCreating: false,
      });

      return get(data, "data", {});
    } catch (error) {
      console.error("getGroups error => ", error);
      setState({ ...state, isCreating: false, error });
      throw error;
    }
  };

  return {
    getGroups,
    removeGroup,
    fetchGroupById,
    updateGroup,
    createGroup,
    fetchGroupAttribute,
    ...state,
  };
};

export type UseGroupsReturnType = ReturnType<typeof useGroups>;

export default useGroups;
