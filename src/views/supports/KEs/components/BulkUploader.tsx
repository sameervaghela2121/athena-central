import { countBy, get, map, omit, reject, size, throttle } from "lodash-es";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  DrawerFooter,
  DrawerHeader,
  LoaderCircle,
  Modal,
  SupportedFilesHint,
} from "@/components";
import FileUploader from "@/components/FileUploader";
import AccessControl from "@/components/KEs/AccessControl";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import {
  ACCESS_ROLE,
  ALLOWED_DOCUMENTS_FILES,
  FILE_UPLOAD_STATUS,
  HTTP_STATUS,
  MAX_FILE_UPLOADS,
  SAVE_MODE,
  USER,
} from "@/shared/constants";
import { useForm } from "react-hook-form";
import AnalyzingDocuments from "./AnalyzingDocuments";
import KnowledgeEntryList from "./KnowledgeEntryList";
import PublishKE from "./PublishKE";

enum ProcessStatus {
  DOCUMENTS_UPLOAD = "DOCUMENTS_UPLOAD",
  ANALYZING_PROGRESS = "ANALYZING_PROGRESS",
  KNOWLEDGE_ENTRY = "KNOWLEDGE_ENTRY",
}

type StatusRecord = Record<"COMPLETED" | "IN_PROGRESS" | "PENDING", number>;

const BulkUploader = ({
  onSave,
  onHelp,
  onClose,
  type = "KE",
  showAccessControlWarning,
  setShowAccessControlWarning,
  submittingNewKE,
  setSubmittingNewKE,
}: {
  onSave: (msg?: string) => void;
  onHelp: () => void;
  onClose: () => void;
  type: "KE" | "BULK-UPLOAD";
  showAccessControlWarning: any;
  setShowAccessControlWarning: any;
  submittingNewKE: any;
  setSubmittingNewKE: any;
}) => {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [openAccessControl, setOpenAccessControl] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  const [step, setStep] = useState<ProcessStatus>(
    ProcessStatus.DOCUMENTS_UPLOAD,
  );

  const { translate } = useTranslate();

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
    getValues,
  } = useForm({
    defaultValues: {
      attributes: {},
      users: [],
      users_access: [],
      usersViewAccess: [],
      usersEditAccess: [],
      attributes_access: [],
      addMemberByType: "BY_SPECIFIC_PEOPLE",
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
  });

  const formValues = watch(); // watch all form fields

  const { submitKE, generateSignURLs, getDocumentId, removeDocumentByIds } =
    useAppState(RootState.KE);
  const {
    user: { is_entity_enabled = false },
  } = useAppState(RootState.AUTH);

  const [documentList, setDocumentList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedDocumentList = useDebounce(documentList, 2000);

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
            }, 2000); // Update progress every 500ms

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
                user_id: USER.id,
                created_by: USER.id,
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

  useEffect(() => {
    const pending_files = documentList.filter(
      (o: any) => o.status === FILE_UPLOAD_STATUS.PENDING,
    );

    if (size(pending_files) > 0) {
      onAttachFiles(pending_files);
    }

    if (size(documentList) === 0) {
      setStep(ProcessStatus.DOCUMENTS_UPLOAD);
    }
  }, [debouncedDocumentList]);

  useEffect(() => {
    // if document list size is empty forcefully jump to first page.
    if (size(documentList) === 0) {
      setStep(ProcessStatus.DOCUMENTS_UPLOAD);
    }
  }, [documentList]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | undefined;
    if (isRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 100)); // Increase progress by 1% every 100ms
      }, 100);
    } else if (progress === 100) {
      clearInterval(interval!);
      setStep(ProcessStatus.KNOWLEDGE_ENTRY);
      setIsRunning(false); // Stop progress at 100%
    }
    return () => clearInterval(interval!); // Cleanup the interval on component unmount
  }, [isRunning, progress]);

  const onSaveBulkKEs = async (status = SAVE_MODE.DRAFT) => {
    setDocumentList([]);

    setIsLoading(true);

    const data = watch();

    const usersEditAccess = get(data, "usersEditAccess", []);
    const attributes_access = get(data, "attributes_access", []);
    const usersViewAccess = get(data, "usersViewAccess", []);
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

    const defaultPermission: any = {
      users_access: [],
      attributes_access: [],
      view_access_to_all_users,
      edit_access_to_all_queue_supporters,
      edit_access_to_all_admins,
      include_all_franchises: is_entity_enabled
        ? include_all_franchises
        : false,
    };

    let users: any = [...usersEditAccess, ...usersViewAccess];

    if (edit_access_to_all_queue_supporters || edit_access_to_all_admins) {
      users = reject(users, { permissions: ACCESS_ROLE.EDITOR });
    }

    if (view_access_to_all_users) {
      users = reject(users, { permissions: ACCESS_ROLE.VIEWER });
    }

    defaultPermission.users_access = users.map((userAccess: any) => {
      return {
        user: userAccess.value,
        permissions: userAccess.permissions,
      };
    });

    if (!byName) {
      defaultPermission.users_access = reject(defaultPermission.users_access, {
        permissions: ACCESS_ROLE.VIEWER,
      });
    }

    if (!view_access_to_all_users) {
      defaultPermission.attributes_access = attributes_access.map(
        (attributes: any) => {
          return {
            ...omit(attributes, ["count", "users"]),
          };
        },
      );
    }

    const payload: any[] = documentList.map((item: any) => ({
      title: item.name || "",
      document_ids: [item.documentId],
      content: "",
      keywords: [],
      status,
      language: "",
      ...defaultPermission,
    }));

    try {
      const KEResult = await submitKE(payload);

      toast.success("KE published successfully!");

      onSave();
      setDocumentList([]);
    } catch (error) {
      toast.error("Something went wrong, please try after sometime");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadSummary = useMemo(() => {
    return countBy(documentList, "status") as StatusRecord;
  }, [documentList]);

  const handleExternalSubmit = () => {
    onSaveBulkKEs(SAVE_MODE.PUBLISHED);
    setSubmittingNewKE(false);
    setShowAccessControlWarning(false);
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  const component = useMemo(() => {
    let component = <></>;
    switch (step) {
      case ProcessStatus.DOCUMENTS_UPLOAD:
        component = (
          <form autoComplete="off" className="relative" ref={formRef}>
            <div className="flex overflow-y-auto relative justify-center px-14 py-9 w-full">
              <div className="flex flex-col gap-y-10 w-full rounded-2xl">
                <div
                  className="overflow-hidden w-full rounded-2xl border"
                  style={{
                    boxShadow: "0px 0px 18px 4px #eee",
                  }}
                >
                  <div className="flex gap-x-2 items-center p-4 bg-header">
                    <h2 className="text-lg font-semibold text-gray-700">
                      {translate("KEs.bulk-upload.title")}
                    </h2>
                    <SupportedFilesHint />
                  </div>
                  <div className="p-4 h-[calc(100vh_-_300px)] flex flex-col gap-y-4">
                    <FileUploader
                      accept={ALLOWED_DOCUMENTS_FILES.DROPZONE}
                      className="h-full"
                      selectedFiles={documentList}
                      onDelete={({ id }: any) => {
                        setDocumentList((prev: any) => {
                          return prev.filter(
                            ({ id: fileId }: any) => fileId !== id,
                          );
                        });
                      }}
                      onChange={(files: any[]) => {
                        if (size(files) > MAX_FILE_UPLOADS.BULK) {
                          toast.error(
                            `You can upload maximum ${MAX_FILE_UPLOADS.BULK} files`,
                          );
                        } else {
                          setDocumentList(files);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="px-32 py-6 w-full"></div>
              </div>
            </div>
            {size(documentList) > 0 && (
              <DrawerFooter className="absolute bottom-0">
                <div className="flex gap-x-6 justify-end items-center w-full">
                  <div className="flex gap-x-6 items-center">
                    <ButtonV2
                      disabled={
                        // true ||
                        size(documentList) <= 0 ||
                        size(documentList) !== uploadSummary.COMPLETED
                      }
                      loading={
                        size(documentList) <= 0 ||
                        size(documentList) !== uploadSummary.COMPLETED
                      }
                      type="button"
                      variant="secondary"
                      rightIcon={allImgPaths.rightArrow}
                      onClick={() => {
                        // startProgress();
                        setStep(ProcessStatus.KNOWLEDGE_ENTRY);
                      }}
                    >
                      {translate("common.next")}
                    </ButtonV2>
                  </div>
                </div>
              </DrawerFooter>
            )}
          </form>
        );
        break;
      case ProcessStatus.ANALYZING_PROGRESS:
        component = <AnalyzingDocuments progress={progress} />;
        break;
      case ProcessStatus.KNOWLEDGE_ENTRY:
        component = (
          <KnowledgeEntryList
            onSave={onSaveBulkKEs}
            onBack={() => {
              setStep(ProcessStatus.DOCUMENTS_UPLOAD);
            }}
            accessControl={
              <div className="flex items-center mr-3">
                <div
                  className="flex gap-x-2 p-2 font-normal rounded-lg cursor-pointer bg-secondary-200"
                  onClick={() => {
                    setSubmittingNewKE(false);
                    setOpenAccessControl(true);
                  }}
                >
                  <img src={allImgPaths.lockBlue} alt="" />
                  <span className="sm:block hidden text-[#246E8C]">
                    {translate("KEs.form.KEAccessControl")}
                  </span>
                </div>
              </div>
            }
            documentList={documentList}
            setDocumentList={setDocumentList}
            setShowAccessControlWarning={setShowAccessControlWarning}
            submittingNewKE={submittingNewKE}
            setSubmittingNewKE={setSubmittingNewKE}
          />
        );
        break;

      default:
        component = <>Invalid Step</>;
        break;
    }

    return component;
  }, [step, documentList, progress, uploadSummary, submittingNewKE]);

  return (
    <>
      <DrawerHeader
        onClose={onClose}
        title={
          <div className="flex gap-x-2 justify-between w-full">
            <div className="flex gap-x-2 items-center">
              {translate("KEs.newBulkKEBtn")}
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
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh_-_73px)]">
          <LoaderCircle text={translate("common.saving")} />
        </div>
      ) : (
        component
      )}

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
          setValue={setValue}
          getValues={getValues}
          handleExternalSubmit={handleExternalSubmit}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
};

export default BulkUploader;
