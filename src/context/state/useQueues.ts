import { useReducer } from "react";

import api from "@/apis/queues";
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
  isFetching: false,
  error: false,
  queueDetail: null,
};

function reducer(state: Queues, action: Queues) {
  return { ...state, ...action };
}

const useQueues = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  /**
   * The function `getQueues` fetches a list of queues with pagination support from the backend and
   * updates the state accordingly.
   * @param {any} payload - The `payload` parameter in the `getQueues` function is an object that
   * contains data to be used for fetching queues. It is passed to the function to customize the
   * request for fetching queues.
   * `fetchQueues` function call.
   */
  const getQueues = async (query: any, isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const { data } = await api.fetchQueues(query);

      setState({
        ...state,
        data: data.data.result,
        total: get(data, "data.pagination_info.total_records", 0),
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("getQueues error => ", error);

      setState({ ...state, data: [], isLoading: false, error });
      return false;
    }
  };

  /**
   * The function `removeQueues` is an asynchronous function that removes queues based on the provided
   * ID and updates the state accordingly.
   * @param {string} id - The `id` parameter in the `removeQueues` function is a string that represents
   * the identifier of the queue that needs to be removed.
   * @returns The `removeQueues` function is returning the `data` received from the
   * `api.removeQueues(id)` call in the `try` block.
   */
  const removeQueues = async (id: string) => {
    try {
      setState({ ...state, isDeleting: true });
      const { data } = await api.removeQueues(id);

      setState({
        ...state,
        isDeleting: false,
      });
      return data;
    } catch (error) {
      setState({ ...state, isDeleting: false, error });
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  /**
   * The function `createQueues` asynchronously creates queues using a provided payload and handles
   * state updates and error logging.
   * @param {any} payload - The `payload` parameter in the `createQueues` function is typically an
   * object containing data that needs to be sent to the server for creating queues. This data could
   * include information such as queue names, queue configurations, or any other relevant details
   * required for creating queues. When the function is called,
   * @returns The `createQueues` function returns the `data` received from the
   * `api.createQueues(payload)` call in the `try` block.
   */
  const createQueues = async (payload: any) => {
    try {
      setState({ ...state, isCreating: true });
      const { data } = await api.createQueues(payload);

      setState({
        ...state,
        isCreating: false,
      });
      return data;
    } catch (error) {
      setState({ ...state, isCreating: false, error });
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  /**
   * The function `updateQueues` asynchronously updates queues using an API call and handles state
   * updates and errors.
   * @param {string} id - The `id` parameter is a string that represents the identifier of the queue
   * that you want to update.
   * @param {any} payload - The `payload` parameter in the `updateQueues` function likely contains data
   * that needs to be sent to the server for updating queues. It could include information such as the
   * new queue details, changes to be made, or any other relevant data required for the update
   * operation. This data is passed to
   * @returns The `updateQueues` function is returning the `data` received from the `api.updateQueues`
   * call after updating the state to indicate that the operation is no longer in progress.
   */
  const updateQueues = async (id: string, payload: any) => {
    try {
      setState({ ...state, isUpdating: true });
      const { data } = await api.updateQueues(id, payload);

      setState({
        ...state,
        isUpdating: false,
      });
      return data;
    } catch (error) {
      setState({ ...state, isUpdating: false, error });
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  const reAssignQueuesToOtherUser = async (payload: any) => {
    try {
      const { data } = await api.reAssignQueuesToOtherUser(payload);

      return data;
    } catch (error) {
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  /**
   * The function `fetchQueueById` asynchronously fetches queue data by ID and updates the state
   * accordingly.
   * @param {any} id - The `id` parameter in the `fetchQueueById` function is used to specify the
   * unique identifier of the queue that you want to fetch from the API. This identifier is typically
   * used to retrieve specific information related to that particular queue.
   * @returns The `fetchQueueById` function is returning the result data fetched from the API,
   * specifically the value located at "data.result". If there is an error during the fetching process,
   * the function will throw an error.
   */
  const fetchQueueById = async (id: string) => {
    try {
      setState({ ...state, isFetching: true });
      const { data } = await api.fetchQueueById(id);

      setState({
        ...state,
        queueDetail: get(data, "data.result", null),
        isFetching: false,
      });
      return get(data, "data.result", null);
    } catch (error) {
      setState({ ...state, isFetching: false, error });
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  return {
    getQueues,
    removeQueues,
    createQueues,
    fetchQueueById,
    updateQueues,
    reAssignQueuesToOtherUser,
    ...state,
  };
};

export type UseQueuesReturnType = ReturnType<typeof useQueues>;

export default useQueues;
