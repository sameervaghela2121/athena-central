import { useReducer } from "react";

import api from "@/apis/users";

import { get } from "lodash-es";

export interface Queues {
  data: any[];
  limit: number;
  page: number;
  total: number;
  isLoading: boolean;
  isDeleting: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isNotifying: boolean;
  isFetching: boolean;
  error: any;
  queueDetail: any;
}

const initialArgs: Queues = {
  data: [],
  limit: 10,
  page: 1,
  total: 0,
  isLoading: true,
  isDeleting: false,
  isCreating: false,
  isUpdating: false,
  isNotifying: false,
  isFetching: false,
  error: false,
  queueDetail: null,
};

function reducer(state: Queues, action: Queues) {
  return { ...state, ...action };
}

const useUsers = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const getUsers = async (query: any, isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const result = await api.fetchUsers(query);

      setState({
        ...state,
        data: result?.result,
        total: get(result, "pagination_info.total_records", 0),
        isLoading: false,
      });
    } catch (error) {
      console.error("getUsers error => ", error);
      setState({ ...state, data: [], isLoading: false, error });
    }
  };

  const getUser = async (id: string) => {
    try {
      setState({ ...state, isFetching: true });
      const data = await api.fetchUserById(id);

      setState({
        ...state,
        isFetching: false,
      });

      return data;
    } catch (error) {
      console.error("getUsers error => ", error);
      setState({ ...state, isFetching: false, error });
    }
  };

  const removeUser = async (id: string) => {
    try {
      setState({ ...state, isDeleting: true });
      const { data } = await api.removeUser(id);

      setState({
        ...state,
        isDeleting: false,
      });
      return data;
    } catch (error) {
      console.error("getUsers error => ", error);
      setState({ ...state, isDeleting: false, error });
      throw error;
    }
  };

  const updateUser = async (id: string, payload: any) => {
    try {
      setState({ ...state, isUpdating: true });
      const data = await api.updateUser(id, payload);

      setState({
        ...state,
        isUpdating: false,
      });

      return data;
    } catch (error) {
      console.error("getUsers error => ", error);
      setState({ ...state, isUpdating: false, error });
      throw error;
    }
  };

  /**
   * Sends notification to admin
   */
  const notifyAdmin = async () => {
    try {
      setState({ ...state, isNotifying: true });
      const data = await api.notifyAdmin();

      setState({ ...state, isNotifying: false });

      return data;
    } catch (error) {
      console.error("notifyAdmin Error:", error);
      setState({ ...state, isNotifying: false, error });
      throw error;
    }
  };

  return {
    getUsers,
    removeUser,
    updateUser,
    getUser,
    notifyAdmin,
    ...state,
  };
};

export type UseUserReturnType = ReturnType<typeof useUsers>;

export default useUsers;
