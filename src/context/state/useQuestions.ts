import api from "@/apis/questions";
import { get } from "lodash-es";
import queryString from "query-string";
import { useReducer } from "react";

export interface Questions {
  data: any[];
  total: number;
  totalQueues: number;
  queues: any[];
  error: any;
  page: number;
  limit: number;
  isLoading: boolean;
  isIgnoring: boolean;
  isRerouting: boolean;
  isLoadingQueues: boolean;
  isAnswering: boolean;
  isFetched: boolean;
}

const initialArgs: Questions = {
  data: [],
  total: 0,
  totalQueues: 0,
  queues: [],
  error: null,
  page: 1,
  limit: 10,
  isLoading: true,
  isIgnoring: false,
  isRerouting: false,
  isLoadingQueues: true,
  isAnswering: false,
  isFetched: false,
};

function reducer(state: Questions, action: Questions) {
  return { ...state, ...action };
}

const useQuestions = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  /**
   * The function `getQuestions` asynchronously fetches questions and updates the state accordingly,
   * handling errors by setting an empty array after a delay.
   */
  const getQuestions = async (payload: any, isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const { data } = await api.fetchQuestions(payload);

      setState({
        ...state,
        data: data.data.result,
        total: get(data, "data.pagination_info.total_records", 0),
        isLoading: false,
        isFetched: true,
      });
    } catch (error) {
      setState({ ...state, data: [], isLoading: false, error });
    }
  };

  const updateQuestions = async (id: string, payload: any) => {
    try {
      const { data } = await api.updateQuestions(id, payload);
      return data;
    } catch (error) {
      console.error("updateQuestions error => ", error);
    }
  };

  /**
   * The function `getQueues` fetches a list of queues with pagination support from the backend and
   * updates the state accordingly.
   * @param {any} payload - The `payload` parameter in the `getQueues` function is an object that
   * contains data to be used for fetching queues. It is passed to the function to customize the
   * request for fetching queues.
   * `fetchQueues` function call.
   */
  const getQueues = async (payload: any) => {
    setState({ ...state, isLoadingQueues: true, queues: [] });
    try {
      const stringified = queryString.stringify(payload);

      const { data } = await api.fetchQueues(stringified);

      setState({
        ...state,
        queues: data.data.result,
        totalQueues: data.data.total,
        isLoadingQueues: false,
      });
      return data.data.result;
    } catch (error) {
      console.error("getQueues error => ", error);

      setState({ ...state, queues: [], isLoadingQueues: false, error });
      return false;
    }
  };

  /**
   * The function `ignoreQuestion` updates the state to indicate that a question is being ignored, then
   * calls a function to reject the question, and finally updates the state again to reflect the
   * completion of the ignoring process.
   * @param payload - The payload object contains two properties:
   */
  const ignoreQuestion = async (
    id: string,
    payload: {
      feedback: string;
    },
  ) => {
    try {
      setState({ ...state, isIgnoring: true });
      const { data } = await api.rejectQuestion(id, payload);

      if (data.status !== 200) {
        throw "Something went wrong";
      }

      setState({ ...state, isIgnoring: false });
      return data;
    } catch (error) {
      setState({ ...state, isIgnoring: false, error });
      throw error;
    }
  };

  /**
   * The function reroutingQuestion asynchronously reroutes a question using provided id and payload,
   * updating state accordingly.
   * @param {string} id - The `id` parameter in the `reroutingQuestion` function is a string
   * representing the identifier of the question being rerouted.
   * @param payload - The `payload` parameter in the `reroutingQuestion` function consists of two
   * properties:
   * @returns The function `reroutingQuestion` is returning the result of the `api.rerouteQuestion`
   * function call inside the `try` block.
   */
  const reroutingQuestion = async (
    id: string,
    payload: {
      feedback: string;
      queue_ids: string;
    },
  ) => {
    try {
      setState({ ...state, isRerouting: true });
      const result = await api.rerouteQuestion(id, payload);
      setState({ ...state, isRerouting: false });

      return result;
    } catch (error) {
      setState({ ...state, isRerouting: false, error });
      throw error;
    }
  };

  const resetState = async () => {
    setState({ ...state, data: [], page: 0, total: 0 });
    return true;
  };

  return {
    getQuestions,
    ignoreQuestion,
    reroutingQuestion,
    getQueues,
    resetState,
    updateQuestions,
    ...state,
  };
};

export type UseQuestionsReturnType = ReturnType<typeof useQuestions>;

export default useQuestions;
