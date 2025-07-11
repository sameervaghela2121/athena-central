import api from "@/apis/KE";
import { HTTP_STATUS } from "@/shared/constants";
import { size } from "lodash-es";
import { useReducer } from "react";
import { get } from "react-hook-form";
import { toast } from "sonner";

export interface KE {
  data: any[];
  total: number;
  error: any;
  page: number;
  limit: number;
  isLoading: boolean;
  isDeleting: boolean;
  isFetching: boolean;
  isFetchingDraftVersion: boolean;
  isPinging: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isGenerating: boolean;
  documentList: any[];
}

const initialArgs: KE = {
  data: [],
  total: 0,
  error: "",
  page: 0,
  limit: 0,
  isLoading: true,
  isDeleting: false,
  isFetching: false,
  isFetchingDraftVersion: false,
  isPinging: false,
  isCreating: false,
  isUpdating: false,
  isGenerating: false,
  documentList: [],
};

function reducer(state: KE, action: KE) {
  return { ...state, ...action };
}

const useKE = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  /**
   * The function `generateSignURLs` asynchronously generates sign URLs using a provided payload and
   * handles errors appropriately.
   * @param {any} payload - The `payload` parameter in the `generateSignURLs` function is the data that
   * is used to generate sign URLs. It is passed as an argument to the function and contains the
   * necessary information required for generating the sign URLs. This data is then used in the logic
   * inside the function to make a
   * @returns The function `generateSignURLs` is returning an array of sign URLs if the API call is
   * successful and the status is OK. If there is an error during the API call or the status is not OK,
   * it will throw an error message "Something went wrong" and display a toast message "failed to
   * generate signed URLs, please try after sometime".
   */
  const generateSignURLs = async (payload: any) => {
    // logic to generate sign URLs
    try {
      const { data, status } = await api.getSignURLs(payload);

      if (status === HTTP_STATUS.OK) {
        return get(data, "data.result.urls", []);
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      toast.error("failed to generate signed URLs, please try after sometime", {
        id: "error-sign-url",
      });
      throw error;
    }
  };

  /**
   * The function `getDocumentId` asynchronously retrieves a document ID from an API and handles errors
   * accordingly.
   * @param {any} payload - The `payload` parameter in the `getDocumentId` function is typically an
   * object containing the necessary data or information required to generate a document ID. This
   * payload is passed as an argument to the `api.getDocumentId` function to retrieve the document ID.
   * The structure and content of the `payload`
   * @returns The function `getDocumentId` is returning the document ID obtained from the API response
   * data if the status is OK. If the status is not OK, it throws an error message "Something went
   * wrong". In case of any errors during the API call or processing, it will display an error toast
   * message and rethrow the error.
   */
  const getDocumentId = async (payload: any) => {
    // logic to generate sign URLs
    try {
      const { data, status } = await api.getDocumentId(payload);

      if (status === HTTP_STATUS.OK) {
        return get(data, "data.result.document_id", "");
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      toast.error("failed to get document id, please try after sometime", {
        id: "error-sign-url",
      });
      throw error;
    }
  };

  // /**
  //  * The function `createBulkKE` asynchronously sends a payload to an API endpoint and returns the
  //  * result data if successful, otherwise throws an error and displays a toast message.
  //  * @param {any} payload - The `payload` parameter in the `createBulkKE` function is the data that
  //  * will be sent to the `api.createBulkKE` function for processing. It could contain information such
  //  * as the items to be created in bulk or any other relevant data needed for the operation.
  //  * @returns If the status is HTTP_STATUS.CREATED, the function will return the result data from the
  //  * response. Otherwise, it will throw an error message "Something went wrong".
  //  */
  // const createBulkKE = async (payload: any) => {
  //   try {
  //     const { data, status } = await api.createBulkKE(payload);

  //     if (status === HTTP_STATUS.CREATED) {
  //       return get(data, "data.result", []);
  //     } else {
  //       throw "Something went wrong";
  //     }
  //   } catch (error) {
  //     toast.error("failed to generate signed URLs, please try after sometime", {
  //       id: "error-sign-url",
  //     });
  //     throw error;
  //   }
  // };

  /**
   * The function `saveBulkKE` is an asynchronous function that saves bulk KE data using an API call
   * and handles success and error scenarios by updating state and displaying a toast message.
   * @param {any} payload - The `payload` parameter in the `saveBulkKE` function is typically an object
   * containing the data that needs to be saved in bulk. This data could be in the form of an array,
   * object, or any other structure depending on the requirements of the `api.saveBulkKE` function.
   * When
   * @returns The function `saveBulkKE` returns the `data` received from the API call if the status is
   * OK. Otherwise, it throws an error message "Something went wrong".
   */
  const saveBulkKE = async (payload: any) => {
    try {
      setState({ ...state, isCreating: true });

      const { data, status } = await api.saveBulkKE(payload);

      if (status === HTTP_STATUS.OK) {
        setState({ ...state, isCreating: false });
        return data;
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      setState({ ...state, isCreating: false });
      toast.error("failed to save KE, please try after sometime", {
        id: "failed-save-KE",
      });
      throw error;
    }
  };

  /**
   * The function `createDocument` asynchronously generates sign URLs for a document using a provided
   * payload.
   * @param {any} payload - The `payload` parameter in the `createDocument` function is the data that
   * will be used to create a document. It is passed to the function as an argument and contains the
   * necessary information required to generate sign URLs for the document.
   * @returns If the status is 200, the function will return the URLs from the data object. If the
   * status is not 200 or an error occurs during the API call, the function will return the error
   * message "Something went wrong".
   */
  const createDocument = async (payload: any) => {
    // logic to generate sign URLs
    try {
      const { data, status } = await api.createDocument(payload);

      if (status === 200) {
        return get(data, "urls", []);
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      return error;
    }
  };

  /**
   * The function `removeDocumentByIds` asynchronously removes documents by their IDs using an API call
   * and returns true if successful, or an error message if something goes wrong.
   * @param {string[]} ids - The `ids` parameter in the `removeDocumentByIds` function is an array of
   * strings that represent the IDs of documents to be removed.
   * @returns The `removeDocumentByIds` function returns a boolean value `true` if the removal of
   * documents with the given `ids` was successful. If there is an error during the process, it will
   * return the error message as a string.
   */
  const removeDocumentByIds = async (ids: string[]) => {
    // logic to generate sign URLs
    try {
      const { status } = await api.removeDocuments(ids);

      if (status === HTTP_STATUS.OK) {
        return true;
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      return error;
    }
  };

  /**
   * The function `toggleLockKE` asynchronously toggles the lock status of a resource identified by its
   * ID and returns signed URLs for the resource.
   * @param {string} id - The `id` parameter in the `toggleLockKE` function is a string that represents
   * the identifier of the item you want to lock or unlock.
   * @param {"lock" | "unlock"} type - The `type` parameter in the `toggleLockKE` function specifies
   * whether to lock or unlock a resource. It can have one of two values: "lock" or "unlock".
   * @returns If the API call is successful and the status is 200, the function will return an array of
   * sign URLs extracted from the response data. If there is an error during the API call or the status
   * is not 200, the function will throw an error message "Something went wrong" or return the error
   * object.
   */
  const toggleLockKE = async (id: string, type: "lock" | "unlock") => {
    // logic to generate sign URLs
    try {
      const { data, status } = await api.toggleLockKE(id, type);

      if (status === 200) {
        return data;
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * The function `submitKE` is an asynchronous function that submits knowledge entries with specified
   * properties and handles the response accordingly.
   * @param payload - The `payload` parameter in the `submitKE` function contains the following
   * properties:
   * @returns The `submitKE` function returns the `data` if the status is `HTTP_STATUS.CREATED`,
   * otherwise it throws an error message "Something went wrong".
   */
  const submitKE = async (
    payload: {
      title: string;
      content: string;
      keywords: string[];
      status: string;
      language: string;
      document_ids: string[];
      users_access?: { user: string; permissions: string }[];
      attributes_access?: { profile: string; permissions: string }[];
    }[],
  ) => {
    try {
      setState({ ...state, isCreating: true });
      const { data, status } = await api.submitKE(payload);

      if (status === HTTP_STATUS.CREATED) {
        setState({ ...state, isCreating: false });
        return data;
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      setState({ ...state, isCreating: false, error });
      throw error;
    }
  };

  /**
   * The function `updateKE` updates a knowledge entity with the provided payload and handles state
   * updates and error handling.
   * @param {string} id - The `id` parameter in the `updateKE` function is a string representing the
   * unique identifier of the knowledge entity that you want to update.
   * @param payload - The `payload` parameter in the `updateKE` function contains the following
   * properties:
   * @returns The `updateKE` function returns the `data` if the status is `HTTP_STATUS.OK`, otherwise
   * it throws an error message "Something went wrong".
   */
  const updateKE = async (
    id: string,
    payload: {
      title: string;
      content: string;
      keywords: string[];
      status: string;
      language: string;
      document_ids: string[];
      users_access?: { user: string; permissions: string }[];
      attributes_access?: { profile: string; permissions: string }[];
    },
  ) => {
    try {
      setState({ ...state, isUpdating: true });
      const { data, status } = await api.updateKE(id, payload);
      setState({ ...state, isUpdating: false });

      if (status === HTTP_STATUS.OK) {
        return data;
      } else {
        throw "Something went wrong";
      }
    } catch (error) {
      setState({ ...state, isUpdating: false, error });
      throw error;
    }
  };

  const generateDocumentChunk = async (documentIds: string[]) => {
    try {
      setState({ ...state, isGenerating: true });
      const result = await api.generateDocumentChunk(documentIds);
      setState({ ...state, isGenerating: false });

      return result;
    } catch (error) {
      setState({ ...state, isGenerating: false, error });
      throw error;
    }
  };

  /**
   * The function `getKEs` is an asynchronous function that fetches data from an API and updates the
   * state with the retrieved data, total records, and loading status.
   * @param {any} payload - The `payload` parameter in the `getKEs` function is typically an object
   * containing data that is needed to make a request to the API. It could include information such as
   * filters, search criteria, or any other data required to fetch the Key Elements (KEs) from the
   * server.
   * @param [isLoading=true] - The `isLoading` parameter in the `getKEs` function is a boolean parameter
   * with a default value of `true`. It is used to indicate whether the data is currently being loaded
   * or not. If `isLoading` is set to `true`, it means that the data is being loaded, and
   */
  const getKEs = async (payload: any, isLoading = true) => {
    try {
      setState({ ...state, isLoading });
      const { data } = await api.getKEs(payload);

      setState({
        ...state,
        data: data.data.result,
        total: get(data, "data.pagination_info.total_records", 0),
        isLoading: false,
      });
    } catch (error: any) {
      if (error.code === "ERR_CANCELED") {
        return;
      }

      setState({ ...state, data: [], isLoading: false, error });
    }
  };

  /**
   * The function `removeKE` is an asynchronous function that handles the removal of an item identified
   * by its ID, updating the state accordingly.
   * @param {string} id - The `id` parameter in the `removeKE` function is a string that represents the
   * identifier of the item that needs to be removed.
   * @returns The `removeKE` function is returning the `data` received from the `api.removeKE(id)` call
   * in the `try` block.
   */
  const removeKE = async (id: string) => {
    try {
      setState({ ...state, isDeleting: true });
      const { data } = await api.removeKE(id);

      setState({
        ...state,
        isDeleting: false,
      });
      return data;
    } catch (error) {
      setState({ ...state, isDeleting: false, error });
      console.error("removeKE error => ", error);
      throw error;
    }
  };

  /**
   * The function `getKEById` asynchronously fetches data by ID using an API call and updates the state
   * accordingly.
   * @param {string} id - The `id` parameter in the `getKEById` function is a string that represents
   * the identifier of the KE (Knowledge Element) that you want to retrieve from the API.
   * @returns The function `getKEById` is returning the data fetched from the API with the specified
   * `id`.
   */
  const getKEById = async (id: string) => {
    try {
      setState({ ...state, isFetching: true });
      const { data } = await api.getKEById(id);

      setState({
        ...state,
        isFetching: false,
      });

      return data.data;
    } catch (error) {
      setState({ ...state, isFetching: false, error });
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  const getKEDraftVersion = async (id: string) => {
    const { data, status } = await api.getKEDraftVersion(id);
    let response = null;

    if (status === HTTP_STATUS.OK) {
      response = get(data, "data.result[0]", null);
    } else if (status === HTTP_STATUS.NOT_FOUND) {
      response = null;
    }

    return response;
  };

  /**
   * The function `setDocumentList` asynchronously updates the documentList in the state.
   * @param {any[]} documentList - The `documentList` parameter is an array of any type of data that
   * you want to set in the state.
   */
  const setDocumentList = async (documentList: any[]) => {
    setState({ ...state, documentList });
  };

  const updateActivityOnKE = async (id: string) => {
    try {
      const { data } = await api.updateActivityOnKE(id);

      if (size(get(data, "errors", "")) > 0) {
        throw "something wrong with set activity on KE";
      }
      return data;
    } catch (error) {
      console.error("getQueues error => ", error);
      throw error;
    }
  };

  return {
    ...state,
    getKEs,
    generateSignURLs,
    createDocument,
    submitKE,
    removeKE,
    setDocumentList,
    toggleLockKE,
    getKEById,
    getKEDraftVersion,
    updateKE,
    // createBulkKE,
    saveBulkKE,
    removeDocumentByIds,
    getDocumentId,
    generateDocumentChunk, // remove once it's start generating from BE
    updateActivityOnKE,
  };
};

export type UseKEReturnType = ReturnType<typeof useKE>;

export default useKE;
