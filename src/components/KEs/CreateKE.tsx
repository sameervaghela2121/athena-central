import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import {
  countBy,
  debounce,
  filter,
  get,
  isEqual,
  map,
  omit,
  reject,
  size,
  startCase,
  throttle,
  toLower,
  toUpper,
} from "lodash-es";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { confirmAlert } from "react-confirm-alert";
import { Controller, useForm } from "react-hook-form";
import { useLocation, useSearchParams } from "react-router-dom";

import request from "@/apis/KE";
import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  DrawerFooter,
  DrawerHeader,
  ErrorText,
  IconButton,
  Input,
  Label,
  LoaderCircle,
  Modal,
  QuillEditor,
  SelectComponent,
  StringCounter,
  SupportedFilesHint,
  Tooltip,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useInternetConnection, useTranslate } from "@/hooks";
import {
  ACCESS_ROLE,
  ALLOWED_DOCUMENTS_FILES,
  DRAFT_KE_TIME,
  FILE_FORMATS_TOOLTIP_CONTENT,
  FILE_UPLOAD_STATUS,
  HTTP_STATUS,
  IDLE_TIMEOUT,
  MAX_FILE_UPLOADS,
  MAX_FILE_UPLOADS_SIZE_LIMIT,
  SAVE_MODE,
} from "@/shared/constants";
import {
  clearAllIntervals,
  formatDate,
  formatSizeUnits,
  sanitizeCkEditorHtml,
} from "@/shared/functions";
import { KEEntry, KE_CONTENT_LIMIT } from "@/validations";
import PublishKE from "@/views/supports/KEs/components/PublishKE";
import { toast } from "sonner";
import FileUploader from "../FileUploader";
import LostInternetModal from "../LostInternetModal";
import AccessControl from "./AccessControl";
import BatchUpdate from "./BatchUpdate";
import InActiveModal from "./InActiveModal";

type StatusRecord = Record<"COMPLETED" | "IN_PROGRESS" | "PENDING", number>;

export enum AddMemberByType {
  BY_SPECIFIC_PEOPLE = "BY_SPECIFIC_PEOPLE",
  BY_ATTRIBUTE = "BY_ATTRIBUTE",
}

const PERMISSIONS_OPTIONS = [
  {
    id: ACCESS_ROLE.OWNER,
    name: (
      <div className="flex gap-x-2 items-center">
        <img src={allImgPaths.userSecondary} />
        <span className="font-medium text-tertiary-700">
          {ACCESS_ROLE.OWNER}
        </span>
      </div>
    ),
  },
  {
    id: ACCESS_ROLE.EDITOR,
    name: (
      <div className="flex gap-x-2 items-center">
        <img src={allImgPaths.editIcon} />
        <span className="font-medium text-tertiary-700">
          {ACCESS_ROLE.EDITOR}
        </span>
      </div>
    ),
  },
  {
    id: ACCESS_ROLE.VIEWER,
    name: (
      <div className="flex gap-x-2 items-center">
        <img src={allImgPaths.viewEye} />
        <span className="font-medium text-tertiary-700">
          {ACCESS_ROLE.VIEWER}
        </span>
      </div>
    ),
  },
];

const CreateKE = ({
  onSave,
  show = false,
  onRestrictedAccess,
  onClose,
  onHelp,
}: {
  show?: boolean;
  onSave: (msg?: string) => void;
  onRestrictedAccess?: (obj: { msg?: string; icon?: string }) => void;
  onClose?: () => void;
  onHelp?: () => void;
  question?: any;
}) => {
  const [open, setOpen] = useState(false);
  const [openAccessControl, setOpenAccessControl] = useState(false);
  const [showBulkNotification, setShowBulkNotification] = useState(false);
  const [activeModal, setActiveModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showAccessControlWarning, setShowAccessControlWarning] =
    useState<boolean>(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [isSelectedDraftVersion, setIsSelectedDraftVersion] = useState<
    boolean | null
  >(null);
  const [KEData, setKEData] = useState<{
    data: any;
    message?: string;
    error?: string;
  }>({
    data: null,
    message: "",
  });
  const [documentList, setDocumentList] = useState<any[]>([]);
  const [data, setData] = useState({});
  const [KEId, setKEId] = useState("");

  const [isDraftRevisionGettingPublished, setIsDraftRevisionGettingPublished] =
    useState("");
  const [lastUpdatedTime, setLastUpdatedTime] = useState<any>("");

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const heartBeatIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const draftIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPayloadRef = useRef<any>(null);
  const initialFormRef = useRef<any>(null);
  const currentFormRef = useRef<any>(null);

  const location = useLocation();
  const { translate } = useTranslate();
  const isOnline = useInternetConnection();
  const debouncedDocumentList = useDebounce(documentList, 2000);
  const [, setSearchParams] = useSearchParams();

  const queryParams = new URLSearchParams(location.search);

  const title = queryParams.get("title") || ""; // Default to an empty string if not provided
  const question_id = queryParams.get("questionId") || "";
  const conversationId = queryParams.get("conversationId") || "";
  const [isNewKE, setIsNewKE] = useState<boolean>(true);

  const {
    generateSignURLs,
    submitKE,
    updateKE,
    getDocumentId,
    getKEById,
    getKEDraftVersion,
    toggleLockKE,
    removeDocumentByIds,
    isCreating,
    isUpdating,
  } = useAppState(RootState.KE);
  const { toggleInternetLostModal, languagesList, isLoadingLanguages } =
    useAppState(RootState.COMMON);

  const {
    user: { is_entity_enabled = false, is_corporate_entity = false },
  } = useAppState(RootState.AUTH);

  const {
    user: { id: userId },
  } = useAppState(RootState.AUTH);

  const {
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    control,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      title,
      content: "",
      question_id,
      language: null,
      keywords: [],
      attributes: {},
      status: SAVE_MODE.DRAFT,
      users: [],
      users_access: [],
      usersViewAccess: [],
      usersEditAccess: [],
      attributes_access: [],
      addMemberByType: "BY_SPECIFIC_PEOPLE",
      currentUserAccess: ACCESS_ROLE.OWNER,
      view: {
        giveAllViewAccess: true,
        giveCustomViewAccess: false,
        byAttribute: false,
        byName: false,
        include_all_franchises: true,
      },
      edit: {
        editAccessToAllAdmins: false,
        giveAllEditAccess: true,
        giveCustomEditAccess: false,
      },
    },
    mode: "all",
    reValidateMode: "onChange",
    resolver: yupResolver(KEEntry),
  });

  const formValues = watch(); // watch all form fields
  currentFormRef.current = {
    ...formValues,
    documents: map(documentList, "document_id"),
  };

  const {
    language = "",
    status,
    currentUserAccess,
    attributes_access = [],
  }: any = formValues;

  const disabled = currentUserAccess === ACCESS_ROLE.VIEWER;

  useEffect(() => {
    if (isSelectedDraftVersion === null) return;
    if (size(KEData.data) <= 0) return;

    const fetchKE = async () => {
      let result = KEData.data ?? null;
      let message = KEData.message ?? "";

      let selfAccessControl = get(result, "access_role", "");

      if (isSelectedDraftVersion) {
        selfAccessControl = ACCESS_ROLE.OWNER;
      }

      if (!selfAccessControl) {
        onRestrictedAccess &&
          onRestrictedAccess({
            msg: "The KE you're trying to access is either unavailable or restricted.",
            icon: allImgPaths.lockRounded,
          });
        return;
      }

      const locked_by = get(result, "lock.locked_by", null);

      if (
        !selfAccessControl ||
        (locked_by &&
          locked_by !== userId &&
          selfAccessControl !== ACCESS_ROLE.VIEWER)
      ) {
        // toast("KE unlock at 290");

        toggleLockKE(KEId, "unlock");
        onRestrictedAccess &&
          onRestrictedAccess({
            msg: message,
            icon: allImgPaths.lockRounded,
          });
        return;
      }

      const keywords = result.keywords.map((keyword: string) => ({
        label: keyword,
        value: keyword,
      }));

      let attributes_access = result.attributes_access;

      let users_access = [];
      if (size(result.users_access) > 0) {
        users_access = result.users_access.map((userAccess: any) => {
          const findPermission: any = PERMISSIONS_OPTIONS.find(
            (perm) => perm.id === userAccess.permissions,
          );

          if (userAccess.user) {
            const user = {
              label: `${userAccess.user.name}(${userAccess.user.username})`,
              name: `${userAccess.user.name}`,
              username: `${userAccess.user.username}`,
              value: userAccess.user.id,
              permissions: findPermission.id,
            };

            return user;
          }
        });
      }

      setData(result);

      if (selfAccessControl !== ACCESS_ROLE.VIEWER) {
        await toggleLockKE(KEId, "lock");
        startHeartBeat();
      }

      const editAccessToAllAdmins = get(
        result,
        "edit_access_to_all_admins",
        false,
      );
      const giveAllEditAccess = get(
        result,
        "edit_access_to_all_queue_supporters",
        false,
      );
      const viewAccessToAllUsers = get(
        result,
        "view_access_to_all_users",
        false,
      );

      if (viewAccessToAllUsers) {
        attributes_access = [];
      }

      setValue("title", result.title, { shouldValidate: false });
      setValue("currentUserAccess", selfAccessControl);
      setValue("content", result.content, { shouldValidate: false });
      setValue("keywords", keywords, { shouldValidate: false });
      setValue("status", result.status, { shouldValidate: false });
      setValue("attributes_access", attributes_access, {
        shouldValidate: false,
      });

      const editorUsers = filter(users_access, {
        permissions: ACCESS_ROLE.EDITOR,
      });
      const viewerUsers = filter(users_access, {
        permissions: ACCESS_ROLE.VIEWER,
      });

      if (viewAccessToAllUsers) {
        setValue("usersViewAccess", []);
      } else {
        setValue("usersViewAccess", viewerUsers);
      }

      if (giveAllEditAccess || editAccessToAllAdmins) {
        setValue("usersEditAccess", []);
      } else {
        setValue("usersEditAccess", editorUsers);
      }

      setValue("view", {
        giveAllViewAccess: viewAccessToAllUsers,
        giveCustomViewAccess: !viewAccessToAllUsers,
        byAttribute: size(attributes_access) > 0,
        byName: size(viewerUsers) > 0,
        include_all_franchises: get(result, "include_all_franchises", false),
      });
      setValue("edit", {
        editAccessToAllAdmins: editAccessToAllAdmins,
        giveAllEditAccess: giveAllEditAccess,
        giveCustomEditAccess: !giveAllEditAccess && !editAccessToAllAdmins,
      });

      let docs = [];

      if (size(result.documents) > 0) {
        docs = result.documents.map((o: any) => ({
          ...o,
          documentId: o.document_id,
          id: o.name + Date.now(),
          file: {
            name: o.name,
            type: o.type,
            size: o.size,
            status: o.status,
            failure_reason: o.failure_reason,
          },
          status: FILE_UPLOAD_STATUS.COMPLETED,
          progress: 100,
        }));
      }

      initialFormRef.current = {
        ...getValues(),
        documents: map(docs, "document_id"),
      };

      setDocumentList(docs); // replace with real data
      setIsFetching(false);
    };
    fetchKE();
  }, [isSelectedDraftVersion, KEData]);

  const checkAndRedirectForLockedKE = async (result: any, message?: string) => {
    let selfAccessControl = ACCESS_ROLE.VIEWER;

    const locked_by = get(result, "lock.locked_by", null);

    if (size(result.attributes_access) > 0) {
      for (const att of result.attributes_access) {
        const attPayload = omit(att, "count", "permissions", "users");
        const { result: listOfAttributeUserIds } =
          await request.fetchUsersCountByAttribute({
            attributes: [attPayload],
          });

        if (listOfAttributeUserIds.includes(userId)) {
          selfAccessControl = att.permissions;
        }
      }
    }

    if (size(result.users_access) > 0) {
      result.users_access.map((userAccess: any) => {
        const findPermission = PERMISSIONS_OPTIONS.find(
          (perm) => perm.id === userAccess.permissions,
        );

        if (userAccess.user) {
          if (userAccess.user.id === userId) {
            selfAccessControl = userAccess.permissions;
          }

          const user = {
            label: `${userAccess.user.name}(${userAccess.user.username})`,
            name: `${userAccess.user.name}`,
            username: `${userAccess.user.username}`,
            value: userAccess.user.id,
            permissions: findPermission,
          };

          return user;
        }
      });
    }

    if (
      locked_by &&
      locked_by !== userId &&
      selfAccessControl !== ACCESS_ROLE.VIEWER
    ) {
      onRestrictedAccess &&
        onRestrictedAccess({
          msg: message,
          icon: allImgPaths.lockRounded,
        });
      onLeave();
      return false;
    }

    return true;
  };

  const fetchKEData = async (KEId: string) => {
    try {
      let result: any;
      let message: any;
      let draftVersionResponse: any;
      let response: any;

      try {
        try {
          setIsFetching(true);
          draftVersionResponse = await getKEDraftVersion(KEId);

          response = await getKEById(KEId);
          setIsFetching(false);

          result = response.result;
          message = response.message;

          const output = await checkAndRedirectForLockedKE(result, message);

          if (!output || !show) return;

          confirmAlert({
            customUI: ({ onClose: onCloseModal }) => {
              return (
                <Modal size="xl" show={true}>
                  <div className="flex flex-col gap-y-10">
                    <div>
                      <div className="flex justify-center">
                        <img src={allImgPaths.fileIcon} alt="file-icon" />
                      </div>
                      <div className="mt-4 text-center">
                        {translate("KEs.form.versionSelectionModal.heading")}:
                      </div>
                    </div>
                    <div className="flex gap-x-5 justify-center">
                      <div>
                        <ButtonV2
                          onClick={() => {
                            setIsSelectedDraftVersion(true);
                            setValue("status", SAVE_MODE.DRAFT);
                            setIsDraftRevisionGettingPublished(SAVE_MODE.DRAFT);

                            setKEData({
                              data: {
                                ...draftVersionResponse,
                                access_role: result.access_role,
                              },
                              message: "",
                              error: "",
                            });
                            startCheckingIdle();
                            onCloseModal();
                            startAutoDraftSave();
                            startHeartBeat();
                          }}
                          variant="tertiaryDark"
                        >
                          {translate(
                            "KEs.form.versionSelectionModal.draftVersion",
                          )}
                        </ButtonV2>
                      </div>
                      <div>
                        <ButtonV2
                          onClick={async () => {
                            setIsSelectedDraftVersion(false);
                            onCloseModal();
                            setValue("status", SAVE_MODE.PUBLISHED);
                            setIsDraftRevisionGettingPublished(SAVE_MODE.DRAFT);

                            setKEData({
                              data: response.result,
                              message,
                            });

                            startCheckingIdle();
                            startAutoDraftSave();
                            startHeartBeat();
                          }}
                          variant="primary"
                        >
                          {translate(
                            "KEs.form.versionSelectionModal.publishedVersion",
                          )}
                        </ButtonV2>
                      </div>
                    </div>
                  </div>
                </Modal>
              );
            },
          });
        } catch (error) {
          console.error("error =>", error);

          setIsFetching(true);

          response = await getKEById(KEId);

          setIsFetching(false);

          result = response.result;
          message = response.message;

          const output = await checkAndRedirectForLockedKE(result, message);

          if (!output || !show) return;

          setIsSelectedDraftVersion(false);

          setValue("status", response.result.status || SAVE_MODE.DRAFT);

          setKEData({
            data: response.result,
            message,
          });

          startCheckingIdle();
        }
      } catch (error) {
        console.error("error =>", error);
        setKEData({
          data: result,
          message,
        });

        const err = get(
          error,
          "response.data.errors.error",
          "Something went wrong, please try again",
        );

        onRestrictedAccess &&
          onRestrictedAccess({ msg: err, icon: allImgPaths.errorIcon });

        onClose && onClose();
      }
    } catch (error) {
      const err = get(
        error,
        "response.data.errors.error",
        "Something went wrong, please try again",
      );

      onRestrictedAccess &&
        onRestrictedAccess({ msg: err, icon: allImgPaths.errorIcon });

      onClose && onClose();
    }
  };

  useEffect(() => {
    if (KEId) {
      if (currentUserAccess !== ACCESS_ROLE.VIEWER) {
        // toggleLockKE(KEId, "lock");
      } else {
        // toast("KE unlock at 639");

        toggleLockKE(KEId, "unlock");
      }
    } else {
      setValue("currentUserAccess", ACCESS_ROLE.OWNER);
    }
  }, [currentUserAccess, KEId]);

  useEffect(() => {
    setTimeout(() => {
      setIsSavingDraft(false);
    }, 1000);
  }, [isSavingDraft]);

  useEffect(() => {
    clearAllIntervals();

    if (!KEId) {
      startAutoDraftSave();
    }
  }, []);

  useEffect(() => {
    const isDraft =
      queryParams.has("isDraft") && queryParams.get("isDraft") === "true";

    if (KEId && !isDraft) {
      fetchKEData(KEId).then(() => {});
    }

    queryParams.delete("isDraft");

    setSearchParams(queryParams);
  }, [KEId, userId, show]);

  useEffect(() => {
    const id: string = queryParams.get("KEId") as string;

    if (id && id !== "new") {
      setKEId(id);
    }
  }, [queryParams]);

  useEffect(() => {
    if (!isOnline) {
      stopHeartBeatInterval();
    } else {
      startHeartBeat();
    }

    toggleInternetLostModal(isOnline);
  }, [isOnline]);

  useEffect(() => {
    const pending_files = debouncedDocumentList.filter(
      (o: any) => o.status === FILE_UPLOAD_STATUS.PENDING,
    );

    if (size(pending_files) > 0) {
      onAttachFiles(pending_files);
    }
  }, [debouncedDocumentList]);

  // Stop interval on page leave or component unmount
  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      // stopInterval();
      // stopAutoSaveInterval();
    };
  }, []);

  useEffect(() => {
    if (size(languagesList) && size(data)) {
      const selectedLang = get(data, "language", "");

      const filteredLang = languagesList.filter(
        (language: any) => toLower(selectedLang) === toLower(language.label),
      );

      setValue("language", filteredLang[0], { shouldValidate: true });
    }
  }, [languagesList, data]);

  const startCheckingIdle = () => {
    // List of events that we want to track for user interaction
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Attach event listeners to reset the idle timer on user interaction
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Set the initial idle timeout
    resetIdleTimer();

    // Cleanup: Remove event listeners when component unmounts
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  };

  // useEffect(() => {
  //   if (!KEId) return;
  //   startCheckingIdle();
  // }, [KEId]);

  useEffect(() => {
    return () => {
      stopHeartBeatInterval();
      stopAutoSaveInterval();
      stopIdleInterval();
    };
  }, []);

  const onChange = useCallback(
    (files: any[]) => {
      if (size(files) > MAX_FILE_UPLOADS.SINGLE) {
        setShowBulkNotification(true);
      } else {
        setDocumentList(files);
      }
    },
    [documentList],
  );

  const onDelete = useCallback(
    ({ id, cancelTokenSource, documentId }: any) => {
      if (documentId) {
        removeDocumentByIds([documentId]);
      }
      if (cancelTokenSource) {
        cancelTokenSource.cancel();
      }

      setDocumentList((prev: any) => {
        return prev.filter(({ id: fileId }: any) => fileId !== id);
      });
    },
    [documentList],
  );

  /**
   * Compares two objects deeply to check if they are equal
   * @param obj1 - First object to compare
   * @param obj2 - Second object to compare
   * @returns Boolean indicating if objects are equal
   */
  const isDeepEqual = (obj1: any, obj2: any): boolean => {
    try {
      return isEqual(obj1, obj2);
    } catch (error) {
      console.error("isDeepEqual Error:", error);
      return false;
    }
  };

  /**
   * Checks if the form data is essentially empty (similar to initial values)
   * @returns Boolean indicating if form has meaningful data
   */
  const isFormEmpty = (): boolean => {
    try {
      const currentValues = getValues();

      // Check for essential fields that would indicate a non-empty form
      const hasTitle = size(currentValues.title) > 0;
      const hasContent = size(currentValues.content) > 0;
      const hasKeywords = size(currentValues.keywords) > 0;
      const hasLanguage = currentValues.language !== null;

      // Form is considered empty if none of the essential fields have values
      const isEmpty = !hasTitle && !hasContent && !hasKeywords && !hasLanguage;

      return isEmpty;
    } catch (error) {
      console.error("isFormEmpty Error:", error);
      return true; // Default to true (empty) on error for safety
    }
  };

  // Debounced save function
  /**
   * Saves the current form state as a draft
   * Only proceeds if the form is dirty or if there are changes compared to the previous payload
   * Skips saving if the form is essentially empty (similar to initial values)
   */
  const saveDraft = useCallback(
    debounce(async () => {
      // Don't save if user is a viewer or if form is not dirty
      if (currentUserAccess === ACCESS_ROLE.VIEWER) return;

      // Skip if form is not dirty
      if (!isDirty) {
        console.log("Form is not dirty");
        return;
      }

      // Skip if form is essentially empty (similar to initial values)
      if (isFormEmpty()) {
        console.log("Form is essentially empty");
        return;
      }

      // Check if there are changes compared to the previous payload
      if (!hasFieldsChanged) {
        console.log("No fields have changed");
        return;
      }

      setValue("status", SAVE_MODE.DRAFT);

      // Generate current payload
      initialFormRef.current = {
        ...getValues(),
        documents: map(documentList, "document_id"),
      };

      saveKE(
        (id) => {
          if (id) {
            queryParams.set("KEId", id);
            queryParams.set("isDraft", "true");
            queryParams.delete("title");
            queryParams.delete("questionId");

            toggleLockKE(id, "lock");
          } else {
            if (conversationId) {
              queryParams.set("KEId", KEId);
              queryParams.set("conversationId", conversationId);
            } else {
              queryParams.set("KEId", KEId);
            }
          }

          setSearchParams(queryParams);
          setLastUpdatedTime(new Date());
        },
        (err) => {
          console.error("saveDraft Error:", err);
        },
      );
    }, 2000), // debounce by 2 seconds
    [queryParams, currentUserAccess, documentList, isDirty],
  );

  // Auto-save every 10 seconds
  useEffect(() => {
    if (activeModal || currentUserAccess === ACCESS_ROLE.VIEWER) return;

    if (draftIntervalRef.current) {
      clearInterval(draftIntervalRef.current);
      // draftIntervalRef.current = null; //
    }

    draftIntervalRef.current = setInterval(() => {
      saveDraft();
    }, DRAFT_KE_TIME);

    return () => {
      if (draftIntervalRef.current) {
        clearInterval(draftIntervalRef.current);
        // draftIntervalRef.current = null; //
      }
    };
  }, [formValues, saveDraft, KEId, currentUserAccess]);

  const startHeartBeat = () => {
    // heartBeatIntervalRef.current = setInterval(async () => {
    //   if (KEId && !activeModal) {
    //     await updateActivityOnKE(KEId);
    //   }
    // }, HEART_BEAT_TIME.KE);
  };

  const startAutoDraftSave = () => {
    if (currentUserAccess === ACCESS_ROLE.VIEWER) {
      return;
    }

    if (!draftIntervalRef.current) {
      draftIntervalRef.current = setInterval(async () => {
        saveDraft();
      }, DRAFT_KE_TIME);
    }
  };

  // Function to stop the interval
  const stopHeartBeatInterval = () => {
    if (heartBeatIntervalRef.current) {
      clearInterval(heartBeatIntervalRef.current);
      heartBeatIntervalRef.current = null;
    }
  };

  // Function to stop the auto save interval
  const stopAutoSaveInterval = () => {
    if (draftIntervalRef.current) {
      clearInterval(draftIntervalRef.current);
      draftIntervalRef.current = null;
    }
  };

  const stopIdleInterval = () => {
    if (idleTimeoutRef.current) {
      // reset the interval if exist
      clearInterval(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  const checkIsDraftRevisionGettingPublished = (
    selectedDataVersion: string,
    saveType: string,
  ) => {
    if (
      selectedDataVersion === SAVE_MODE.DRAFT &&
      saveType === SAVE_MODE.PUBLISHED
    ) {
      return true;
    }

    return false;
  };

  /**
   * Generates a payload object from form data
   * @param data - Form data from watch()
   * @returns The payload object to be sent to the API
   */
  const generatePayload = (data: any) => {
    const keywords = map(data.keywords, "label");
    const documentIds = filter(map(documentList, "documentId")); /// retrieve documentIds and remove nullish document
    const usersEditAccess = get(data, "usersEditAccess", []);
    const usersViewAccess = get(data, "usersViewAccess", []);
    const language = toUpper(get(data, "language.label", ""));
    const view_access_to_all_users = get(data, "view.giveAllViewAccess", false);
    const byName = get(data, "view.byName", false);
    const edit_access_to_all_queue_supporters = get(
      data,
      "edit.giveAllEditAccess",
      false,
    );
    const edit_access_to_all_admins = get(
      data,
      "edit.editAccessToAllAdmins",
      false,
    );

    const include_all_franchises = get(
      data,
      "view.include_all_franchises",
      false,
    );

    const payload: any = {
      title: data?.title || "untitled",
      content: data.content || "",
      keywords,
      status: data.status || SAVE_MODE.DRAFT,
      is_draft_revision_getting_published: checkIsDraftRevisionGettingPublished(
        isDraftRevisionGettingPublished,
        data.status,
      ),
      language,
      document_ids: documentIds,
      users_access: [],
      attributes_access: [],
      view_access_to_all_users,
      edit_access_to_all_queue_supporters,
      edit_access_to_all_admins,
      include_all_franchises:
        is_entity_enabled && is_corporate_entity
          ? include_all_franchises
          : false,
    };

    let users = [...usersEditAccess, ...usersViewAccess];

    if (edit_access_to_all_queue_supporters || edit_access_to_all_admins) {
      users = reject(users, { permissions: ACCESS_ROLE.EDITOR });
    }

    if (view_access_to_all_users) {
      users = reject(users, { permissions: ACCESS_ROLE.VIEWER });
    }

    const users_access = users.map((userAccess: any) => {
      return {
        user: userAccess.value,
        permissions: userAccess.permissions,
      };
    });

    payload.users_access = !byName
      ? reject(users_access, { permissions: ACCESS_ROLE.VIEWER })
      : users_access;

    if (!view_access_to_all_users) {
      payload.attributes_access = attributes_access.map((attributes: any) => {
        return {
          ...omit(attributes, ["count", "users"]),
        };
      });
    }

    if (question_id) {
      payload.question_id = question_id;
    }

    return payload;
  };

  const saveKE = async (
    onSuccess: (KEId?: string, message?: string) => void,
    onError?: (err?: any) => void,
  ) => {
    setIsSavingDraft(true);

    const data = watch();
    const payload = generatePayload(data);

    let msg = "";
    let id = "";

    try {
      if (KEId) {
        const data = await updateKE(KEId, payload);
        msg = get(data, "data.message", "KE updated successfully");
      } else {
        const {
          data: { message, result },
        } = await submitKE([payload]);
        msg = message;
        setValue("title", payload.title);
        id = get(result, "[0].entry_id", "");
      }
      setIsSavingDraft(false);

      onSuccess(id, msg);
    } catch (error) {
      console.error("saveKE error =>", error);

      const err = get(
        error,
        "response.data.data.message",
        "Something went wrong. Please try again",
      );

      onError && onError(err);
    }
  };

  // on save KE record
  const onSubmit = async (data: any) => {
    saveKE(
      (KEId, message) => {
        stopAutoSaveInterval();
        stopHeartBeatInterval();
        stopIdleInterval();
        onSave(message);
      },
      (err) => {
        // toast("KE unlock at 1118");
        toggleLockKE(KEId, "unlock");
        onRestrictedAccess &&
          onRestrictedAccess({ msg: err, icon: allImgPaths.lockRounded });
      },
    );
    setIsNewKE(true);
  };

  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) {
      // reset the interval if exist
      clearInterval(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      // toast("KE unlock at 1134");
      toggleLockKE(KEId, "unlock"); // TODO:check this frequently timer call
      setActiveModal(true);
      idleTimeoutRef.current = null;
      // stopInterval();

      // Perform any action like logging out the user or saving form data
    }, IDLE_TIMEOUT);
  };

  // on attachment button click
  const onAttachFiles = async (pending_files: any[]) => {
    const fileNames = map(pending_files, "file.name");

    if (size(fileNames) <= 0) return; // return if no file pending to upload

    try {
      const signedUrls = await generateSignURLs({ file_names: fileNames });

      await Promise.all(
        pending_files.map(async (obj, index) => {
          const { file, id, cancelTokenSource } = obj;
          const signedUrl = signedUrls[index].signed_url;
          const url = signedUrls[index].file_url;

          try {
            // Throttle the progress update to reduce frequent re-renders
            const updateProgress = throttle((progress: number, id: string) => {
              setDocumentList((documentList: any) => {
                const _documentList = [...documentList];
                const index = _documentList.findIndex((o: any) => o.id === id);
                if (index >= 0) {
                  _documentList[index].progress = progress;
                  _documentList[index].status =
                    progress === 100
                      ? FILE_UPLOAD_STATUS.COMPLETED
                      : FILE_UPLOAD_STATUS.IN_PROGRESS;
                }
                return _documentList;
              });
            }, 1000); // Update progress every 500ms

            const { status, data } = await api.put(signedUrl, file, {
              headers: {
                "Content-Type": "application/octet-stream", // Set the correct content type
              },
              cancelToken: cancelTokenSource.token,
              onUploadProgress: (progressEvent: any) => {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total,
                );

                updateProgress(progress, id);
              },
            });

            if (status === HTTP_STATUS.OK) {
              const payload = {
                url,
                mime_type: file.type || "N/A",
                size: file.size,
                user_id: userId,
                created_by: userId,
              };

              // get related ID from this function

              try {
                const documentId = await getDocumentId(payload);

                setDocumentList((prev: any) => {
                  const index = prev.findIndex((o: any) => o.id === id);

                  if (index >= 0) {
                    prev[index].documentId = documentId;
                    prev[index].progress = 100;
                    prev[index].status = FILE_UPLOAD_STATUS.COMPLETED;
                  }

                  return prev;
                });
              } catch (error) {}
            }

            return data;
          } catch (err) {
            setDocumentList((prev: any) => {
              const index = prev.findIndex((o: any) => o.id === id);

              if (index >= 0) {
                prev[index].progress = 0;
                prev[index].status = FILE_UPLOAD_STATUS.DELETED;
              }
              return prev;
            });

            throw err;
          }
        }),
      );
    } catch (error) {
      console.error("onAttachFiles error =>", error);
    }
  };

  /**
   * Handles file selection from the file input
   * Validates file size and count limits before adding files to the document list
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files: any[] = [...(event.target.files as any)];

    if (files && files.length > 0) {
      // Check if adding these files would exceed the maximum file count
      const currentFileCount = size(documentList);
      const maxFilesAllowed = MAX_FILE_UPLOADS.SINGLE;
      const remainingSlots = maxFilesAllowed - currentFileCount;

      if (currentFileCount + files.length > maxFilesAllowed) {
        toast.error(`Maximum file limit of ${maxFilesAllowed} reached`);
        // Clear the file input value
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Limit the number of files to the remaining slots
      const filesToProcess =
        remainingSlots < files.length ? files.slice(0, remainingSlots) : files;

      // Filter out files that exceed the size limit or have invalid formats
      const validFiles: File[] = [];
      const invalidSizeFiles: File[] = [];
      const invalidFormatFiles: File[] = [];

      // Use the constants for file size limit and allowed formats
      const MAX_SIZE = MAX_FILE_UPLOADS_SIZE_LIMIT.SINGLE;
      const allowedFormatsInput = ALLOWED_DOCUMENTS_FILES.INPUT.split(",");
      const allowedMimeTypes = Object.keys(ALLOWED_DOCUMENTS_FILES.DROPZONE);

      /**
       * Checks if a file has a valid format based on extension and mime type
       * @param file - The file to validate
       * @returns boolean indicating if the file format is valid
       */
      const isValidFileFormat = (file: File): boolean => {
        try {
          // Check by mime type
          if (allowedMimeTypes.includes(file.type)) {
            return true;
          }

          // Check by file extension as fallback
          const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
          return allowedFormatsInput.includes(fileExtension);
        } catch (error) {
          console.error("isValidFileFormat Error:", error);
          return false;
        }
      };

      filesToProcess.forEach((file) => {
        if (file.size > MAX_SIZE) {
          invalidSizeFiles.push(file);
        } else if (!isValidFileFormat(file)) {
          invalidFormatFiles.push(file);
        } else {
          validFiles.push(file);
        }
      });

      // Log error for files that exceed the size limit
      if (invalidSizeFiles.length > 0) {
        toast.error(`File is larger than ${formatSizeUnits(`${MAX_SIZE}`)}`, {
          id: "file-size-error",
        });
      }

      // Log error for files with invalid formats
      if (invalidFormatFiles.length > 0) {
        // Show toast with Learn More button for unsupported file types
        toast.error(
          `Error: Unsupported file type. Please upload a valid file.`,
          {
            duration: 30000,
            classNames: {
              toast: "flex-col items-start", // or use grid like you mentioned above
              actionButton:
                "w-full justify-end !bg-transparent !text-status-info p-2 rounded",
            },
            id: "file-type-error",
            action: {
              label: `${translate("common.learnMore")}`,
              onClick: () => {
                // Show modal with supported file formats
                toast.info(
                  <div className="p-4 space-y-3 w-full max-w-md bg-white rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex gap-2 items-center pb-2 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Supported File Formats
                      </h3>
                    </div>

                    <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2 custom-scrollbar">
                      <ul className="pl-2 space-y-3">
                        {Object.entries(FILE_FORMATS_TOOLTIP_CONTENT).map(
                          ([category, formats], index) => (
                            <li key={index} className="mb-2">
                              <b className="font-bold text-tertiary-900">
                                {startCase(category)}
                              </b>
                              :
                              <ul className="px-4 list-disc">
                                {(formats as any[]).map((format, idx) => (
                                  <li key={idx}>
                                    <span className="font-medium text-gray-800">
                                      {format.type}
                                    </span>{" "}
                                    —{" "}
                                    <span className="text-gray-600">
                                      {format.desc}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100 text-sm font-medium text-gray-700">
                      <span>
                        Maximum file size:{" "}
                        <span className="font-semibold text-gray-900">
                          {(
                            MAX_FILE_UPLOADS_SIZE_LIMIT.SINGLE /
                            (1024 * 1024)
                          ).toFixed(0)}{" "}
                          MB
                        </span>{" "}
                        per file
                      </span>
                      <button
                        className="ml-auto px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        onClick={() => toast.dismiss("supported-file-formats")}
                      >
                        Close
                      </button>
                    </div>
                  </div>,
                  {
                    duration: 30000,
                    id: "supported-file-formats",
                    className: "file-formats-toast !p-0",
                  },
                );
              },
            },
          },
        );
      }

      // Process only valid files
      if (validFiles.length > 0) {
        const _files = validFiles.map((file) => {
          return {
            id: file.name + Date.now(),
            file,
            status: FILE_UPLOAD_STATUS.PENDING,
            progress: 0,
            cancelTokenSource: axios.CancelToken.source(), // Create a cancel token source for each file
          };
        });

        // Update the document list first
        setDocumentList((prevList) => {
          const newList = [...prevList, ..._files];
          // Directly call onAttachFiles with the new files to trigger upload
          setTimeout(() => onAttachFiles(_files), 0);
          return newList;
        });
        setOpen(true);
      }

      // Clear the file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onContinue = async () => {
    // check if KE is locked by other or not
    try {
      const { result, message } = await getKEById(KEId);

      const locked_by = get(result, "lock.locked_by", null);

      if (locked_by && locked_by !== userId) {
        onRestrictedAccess &&
          onRestrictedAccess({
            msg: message,
            icon: allImgPaths.lockRounded,
          });
        onLeave();
      } else {
        // no one locked while inactivity on KE.
        toggleLockKE(KEId, "lock");
        setActiveModal(false);
        startHeartBeat();
        startAutoDraftSave();

        startCheckingIdle();
      }
    } catch (error) {}
  };

  const onLeave = () => {
    stopHeartBeatInterval();
    stopAutoSaveInterval();
    if (KEId) {
      // toast("KE unlock at 1395");
      toggleLockKE(KEId, "unlock");
    }
    onSave && onSave();
  };

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
      setIsNewKE(true);
    }
  };

  const uploadSummary = useMemo(() => {
    return countBy(documentList, "status") as StatusRecord;
  }, [documentList]);

  const isDocumentUploadInProgress = useMemo(() => {
    return (
      size(documentList) > 0 && size(documentList) !== uploadSummary.COMPLETED
    );
  }, [documentList, uploadSummary]);

  /**
   * Check if specific fields have changed between initial and current form state
   * Compares language, title, content, keywords, and documents fields
   * Also returns true if this is a new KE and fields have values
   */
  const hasFieldsChanged = useMemo(() => {
    try {
      if (!currentFormRef.current) return false;

      // If this is a new KE, check if any of the fields have values
      if (!KEId) {
        const hasValues = [
          "language",
          "title",
          "content",
          "keywords",
          "documents",
        ].some((key) => {
          const value = get(currentFormRef.current, key);

          // Check if the field has a non-empty value
          if (Array.isArray(value)) {
            return value.length > 0;
          }

          return Boolean(value);
        });

        if (hasValues) {
          console.info("New KE with field values detected");
          return true;
        }
      }

      // For existing KEs, continue with the original logic
      if (!initialFormRef.current) return false;

      // Check if any of the specified fields have changed
      return ["language", "title", "content", "keywords", "documents"].some(
        (key) => {
          let initialValue = get(initialFormRef.current, key);
          let currentValue = get(currentFormRef.current, key);

          if (key === "documents") {
            initialValue = initialValue?.sort();
            currentValue = currentValue?.sort();
          }
          return !isEqual(initialValue, currentValue);
        },
      );
    } catch (error) {
      console.error("hasFieldsChanged Error:", error);
      return false;
    }
  }, [initialFormRef.current, currentFormRef.current, isNewKE, KEId]);

  return (
    <>
      <DrawerHeader
        // onClose={onClose}
        title={
          <div className="flex justify-between w-full">
            <div className="flex gap-x-2 items-center">
              <div>
                {KEId
                  ? translate("KEs.form.editKE")
                  : translate("KEs.form.createKE")}
              </div>
              <div
                className="flex gap-x-1 items-center cursor-pointer text-tertiary-400"
                onClick={() => onHelp && onHelp()}
              >
                <img
                  src={allImgPaths.infoDark}
                  alt="help"
                  className="transition-opacity cursor-help hover:opacity-80"
                />
              </div>
            </div>
            <div className="flex gap-x-2">
              <div
                className="flex gap-x-2 p-2 font-normal rounded-lg cursor-pointer lg:min-w-52 bg-secondary-200"
                onClick={() => {
                  setOpenAccessControl(true);
                  setIsNewKE(false);
                }}
              >
                <img src={allImgPaths.lockBlue} alt="" />
                <span className="sm:block hidden text-[#246E8C]">
                  {translate("KEs.form.KEAccessControl")}
                </span>
              </div>
              {conversationId && (
                <div
                  className="flex gap-x-1 p-2 bg-white rounded-lg border duration-200 cursor-pointer hover:bg-secondary-100 border-tertiary-200"
                  // onClick={() => setChatOpen(true)}
                  onClick={() => {
                    (window as any)
                      .open(
                        `${window.location.origin}/chats/${conversationId}?q=history`,
                        "_blank",
                        // "width=500,height=1000",
                      )
                      .focus();
                  }}
                >
                  {/* <img src={allImgPaths.message} /> */}
                  <span className="font-normal text-tertiary-700">
                    {translate("chats.chatHistory")}
                  </span>
                  <img src={allImgPaths.externalLink} alt="" />
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="flex justify-center">
        {isFetching ? (
          <div className="mt-80">
            <LoaderCircle />
          </div>
        ) : (
          <form
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
            className="flex relative flex-col justify-between w-full"
            ref={formRef}
          >
            <>
              <div
                className={`${open ? "h-[calc(100vh_-_90px)]" : "h-[calc(100vh_-_172px)]"} overflow-auto p-8 flex flex-col gap-y-4`}
              >
                {!open && (
                  <>
                    {/* title */}
                    <div className="">
                      <Label required>
                        {translate("questions.answer.form.title")}
                      </Label>

                      <Input
                        disabled={disabled}
                        name="title"
                        control={control}
                        placeholder={translate(
                          "questions.answer.form.title-placeholder",
                        )}
                        errors={errors}
                      />
                    </div>

                    <div className="z-50">
                      <Label>
                        {translate("questions.answer.form.description")}
                      </Label>
                      <div className="relative bg-header rounded-b-[8px] border-b h-[560px] overflow-hidden">
                        <Controller
                          disabled={disabled}
                          render={({ field }) => (
                            <>
                              <div className="relative">
                                <QuillEditor {...field} disabled={disabled} />
                              </div>
                              <StringCounter
                                limit={KE_CONTENT_LIMIT}
                                value={sanitizeCkEditorHtml(
                                  field.value as string,
                                )}
                                className="!bottom-[72px]"
                              />
                            </>
                          )}
                          name={"content"}
                          control={control}
                        />
                        <div className="flex flex-col gap-x-3 justify-between items-center w-full bg-header">
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between px-4 py-2 w-full">
                              <div className="flex flex-col gap-y-1 select-none">
                                <div className="flex gap-2 items-center">
                                  <Label>
                                    {size(documentList) > 0
                                      ? `${size(documentList)} Documents Attached`
                                      : "Attach Documents"}
                                  </Label>
                                </div>
                                {size(documentList) > 0 ? (
                                  <span className="text-sm text-tertiary-400">
                                    <p className="flex gap-x-1">
                                      Click
                                      <a
                                        href="#"
                                        className="not-italic font-bold text-primary-500 hover:underline"
                                        onClick={() => setOpen((prev) => !prev)}
                                      >
                                        here to view the documents{" "}
                                      </a>
                                      before publishing.
                                    </p>
                                  </span>
                                ) : (
                                  <span className="text-sm italic text-tertiary-400">
                                    Attaching documents helps Athena give more
                                    accurate and reliable answers to user
                                    questions.
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-x-2 cursor-pointer">
                                <div>
                                  <input
                                    type="file"
                                    accept={ALLOWED_DOCUMENTS_FILES.INPUT}
                                    ref={fileInputRef}
                                    className="hidden" // Keep file input hidden
                                    onChange={handleFileChange}
                                    multiple
                                  />
                                  <div className="relative">
                                    <IconButton
                                      type="button"
                                      src={allImgPaths.attachmentPin}
                                      onClick={() =>
                                        fileInputRef.current?.click()
                                      }
                                      className="!rounded-lg !bg-white !p-3 border border-[#C2C2C2] shadow-[inset_2px_2px_7.2px_0px_rgba(195,195,195,0.25)]"
                                    />
                                    {size(documentList) > 0 && (
                                      <span className="flex hidden absolute -top-2 -right-2 justify-center items-center w-5 h-5 text-xs font-bold text-white rounded-full bg-secondary-900">
                                        {size(documentList)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* File Upload Status Indicator */}
                            {size(documentList) > 0 && (
                              <div className="hidden px-3 py-2 mt-2 mb-1 bg-gray-50 rounded-md border border-gray-200">
                                <div className="flex justify-between items-center">
                                  <div className="flex gap-x-2 items-center">
                                    <img
                                      src={allImgPaths.fileIcon}
                                      alt="files"
                                      className="w-5 h-5"
                                    />
                                    <span className="text-sm font-medium">
                                      {translate("common.documents")}:{" "}
                                      {size(documentList)}
                                    </span>
                                  </div>
                                  <div className="flex gap-x-3 items-center">
                                    {/* Status indicators */}
                                    <div className="flex gap-x-3 mr-3">
                                      {uploadSummary.COMPLETED > 0 && (
                                        <div className="flex gap-x-1 items-center">
                                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                          <span className="text-xs">
                                            {uploadSummary.COMPLETED}{" "}
                                            {translate("common.done")}
                                          </span>
                                        </div>
                                      )}
                                      {uploadSummary.IN_PROGRESS > 0 && (
                                        <div className="flex gap-x-1 items-center">
                                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                          <span className="text-xs">
                                            {uploadSummary.IN_PROGRESS}{" "}
                                            {translate("common.loading")}
                                          </span>
                                        </div>
                                      )}
                                      {uploadSummary.PENDING > 0 && (
                                        <div className="flex gap-x-1 items-center">
                                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                          <span className="text-xs">
                                            {uploadSummary.PENDING} {"Pending"}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-x-2">
                                      {/* Attach button */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          fileInputRef.current?.click()
                                        }
                                        className="p-1 rounded-md transition-colors duration-200 hover:bg-gray-200"
                                        title="Attach more files"
                                      >
                                        <img
                                          src={allImgPaths.attachmentPin}
                                          alt="Attach"
                                          className="w-4 h-4"
                                        />
                                      </button>

                                      {/* View button */}
                                      <button
                                        type="button"
                                        onClick={() => setOpen((prev) => !prev)}
                                        className="p-1 rounded-md transition-colors duration-200 hover:bg-gray-200"
                                        title="View files"
                                      >
                                        <img
                                          src={allImgPaths.eyeIconBlack}
                                          alt="View"
                                          className="w-4 h-4"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress bar for overall upload progress */}
                                {isDocumentUploadInProgress && (
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
                                        style={{
                                          width: `${Math.round((uploadSummary.COMPLETED / size(documentList)) * 100)}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <ErrorText errors={errors} name={"content"} />
                    </div>

                    {/* keywords */}
                    {/* <div className="">
                      <Label>{translate("KEs.form.keywords.title")}</Label>
                      <KeywordSelector
                        disabled={disabled}
                        name="keywords"
                        control={control}
                        placeholder={translate("KEs.form.keywords.placeholder")}
                        errors={errors}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm italic text-tertiary-400">
                          {translate("KEs.form.keywords.caption")}
                        </span>
                      </div>
                    </div> */}

                    {/* language */}
                    <div className="">
                      <Label> {translate("KEs.form.languages.title")}</Label>
                      <SelectComponent
                        value={language}
                        isLoading={isLoadingLanguages}
                        name="language"
                        isDisabled={disabled}
                        placeholder={translate(
                          "KEs.form.languages.placeholder",
                        )}
                        options={languagesList}
                        closeMenuOnSelect={true}
                        onChange={(data: any) => {
                          let value = data;

                          if (isEqual(language, data)) {
                            value = null;
                          }

                          setValue("language", value, {
                            shouldValidate: true,
                          });
                        }}
                        errors={errors}
                      />
                    </div>
                  </>
                )}

                {/* file upload */}
                {open && (
                  <div className="flex overflow-auto flex-col gap-y-4 w-full h-full rounded-lg border border-gray-300 shadow-md">
                    <div className="p-4 mb-4 bg-header">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-x-2 items-center">
                          <h2 className="text-base font-semibold text-gray-700 lg:text-lg">
                            {translate("KEs.bulk-upload.title")}
                          </h2>
                          <div className="flex items-center">
                            <SupportedFilesHint />
                          </div>
                        </div>
                        {size(documentList) <= 0 && (
                          <Tooltip content={"Return to previous screen"}>
                            <div
                              onClick={() => setOpen(false)}
                              className="p-2 bg-white rounded-lg duration-200 cursor-pointer"
                            >
                              <img
                                src={allImgPaths.closeIcon}
                                alt="close"
                                className="w-4 h-4"
                              />
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="p-4 h-full">
                      <FileUploader
                        disabled={disabled}
                        listContainerClass="h-[calc(100vh_-_470px)] !pr-0"
                        accept={ALLOWED_DOCUMENTS_FILES.DROPZONE}
                        className="h-full"
                        selectedFiles={documentList}
                        onDelete={onDelete}
                        onChange={onChange}
                        onClose={() => setOpen(false)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {!open && (
                <DrawerFooter>
                  <>
                    <div className="flex w-full">
                      {lastUpdatedTime && (
                        <div className="flex gap-x-2 items-center italic text-tertiary-700">
                          <img
                            src={allImgPaths.refresh}
                            alt="refresh"
                            className="opacity-50"
                          />
                          <span>{`Last Saved ${formatDate(lastUpdatedTime, "hh:mm A")}`}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-x-6 justify-end items-center w-full">
                      {!disabled && (
                        <div className="flex gap-x-6 items-center">
                          <ButtonV2
                            type={hasFieldsChanged ? "submit" : "button"}
                            variant="tertiaryDark"
                            disabled={isDocumentUploadInProgress}
                            onClick={() => {
                              if (hasFieldsChanged) {
                                setValue("status", SAVE_MODE.DRAFT);
                              } else {
                                onLeave();
                              }
                            }}
                          >
                            {/* {translate("common.closeDraft")} */}
                            {hasFieldsChanged
                              ? translate("common.closeDraft")
                              : translate("common.close")}
                          </ButtonV2>

                          <ButtonV2
                            variant="primary"
                            loading={
                              status === SAVE_MODE.PUBLISHED &&
                              (isCreating || isUpdating)
                            }
                            disabled={isDocumentUploadInProgress}
                            onClick={async () => {
                              // if not validate form then do nothing
                              const result = await trigger();
                              if (!result) return;
                              if (isNewKE) {
                                setIsNewKE(false);
                                setShowAccessControlWarning(true);
                              } else {
                                setValue("status", SAVE_MODE.PUBLISHED);
                                handleExternalSubmit();
                              }
                            }}
                            rightIcon={allImgPaths.rightArrow}
                          >
                            {!KEId || (KEId && status === SAVE_MODE.DRAFT)
                              ? translate("common.publish")
                              : translate("common.update")}
                          </ButtonV2>
                        </div>
                      )}

                      {disabled && (
                        <div className="flex gap-x-6 items-center">
                          <ButtonV2
                            variant="tertiaryDark"
                            rightIcon={allImgPaths.rightArrowGrayIcon}
                            onClick={() => {
                              onClose && onClose();
                            }}
                          >
                            {translate("common.close")}
                          </ButtonV2>
                        </div>
                      )}
                    </div>
                  </>
                </DrawerFooter>
              )}
            </>
          </form>
        )}

        {/* batch updated notification when N documents upload into KE */}
        <BatchUpdate
          show={showBulkNotification}
          onClose={() => {
            setShowBulkNotification(false);
          }}
        />

        {/*  Modal for user's InActivity notification for KE unlock */}
        <InActiveModal
          show={activeModal}
          setActiveModal={setActiveModal}
          onLeave={onLeave}
          onContinue={onContinue}
        />

        {/* When user lost internet and notify user*/}
        <LostInternetModal
          heading="Lost internet"
          text="Your KE data will be lost"
        />
      </div>

      <Modal
        backdrop={false}
        show={openAccessControl}
        size="2xl"
        extraClasses={"p-0"}
      >
        <AccessControl
          setValue={setValue}
          getValues={getValues}
          formValues={formValues}
          onClose={() => setOpenAccessControl(false)}
        />
      </Modal>

      <Modal show={showAccessControlWarning} size="lg" extraClasses={"p-0"}>
        <PublishKE
          setOpenAccessControl={setOpenAccessControl}
          setShowAccessControlWarning={setShowAccessControlWarning}
          getValues={getValues}
          setValue={setValue}
          isLoading={isCreating || isUpdating}
          handleExternalSubmit={handleExternalSubmit}
          onClose={() => {
            setShowAccessControlWarning(false);
            setIsNewKE(true);
          }}
        />
      </Modal>
    </>
  );
};

export default React.memo(CreateKE);
