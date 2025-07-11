import allImgPaths from "@/assets";
import { ButtonV2, DrawerFooter, Modal, Textarea } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { SAVE_MODE } from "@/shared/constants";
import { removeExtension } from "@/shared/functions";
import { get, size } from "lodash-es";
import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";
const title = `What are the guidelines for applying for extended medical leave, and how does it impact? What are the guidelines for applying for extended medical leave, and how does it impact?`;

const BulkKECreation = ({
  fileName,
  file,
  onDelete,
  onChange,
}: {
  fileName: string;
  file: File;
  onDelete: () => void;
  onChange: (text: string) => void;
}) => {
  const [text, setText] = useState(removeExtension(fileName));

  const [isEditTitle, setIsEditTitle] = useState(false);

  const updateName = () => {
    setIsEditTitle(false);
    onChange(text);
  };

  const { type = "" } = file ?? {};

  const fileIconMapper: any = {
    "application/msword": allImgPaths.docx,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      allImgPaths.docx,
    "application/pdf": allImgPaths.pdf,
    "text/html": allImgPaths.html,
    "text/plain": allImgPaths.txt,
  };

  return (
    <div className="overflow-hidden w-full rounded-2xl border">
      <div className="flex justify-between items-center px-4 py-3 bg-header">
        <div className="flex gap-x-2 items-start px-3 py-1 w-full bg-white rounded-full line-clamp-1">
          <div className="pt-1 w-6">
            <img
              className="object-contain w-5 h-5"
              src={fileIconMapper[type] ?? allImgPaths.file}
              alt="file"
            />
          </div>
          <div className="w-full">
            <span className="line-clamp-1">{fileName}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center">
            <div
              className="p-2 rounded-full duration-500 cursor-pointer hover:bg-status-info/20 shrink-0"
              onClick={() => {
                if (isEditTitle) {
                  updateName();
                } else {
                  setIsEditTitle((prev) => !prev);
                }
              }}
            >
              <img
                src={isEditTitle ? allImgPaths.tickIconLight : allImgPaths.edit}
                className="w-5 h-5"
              />
            </div>
            <div
              className="p-2 rounded-full duration-500 cursor-pointer hover:bg-status-error/20 shrink-0"
              onClick={onDelete}
            >
              <img src={allImgPaths.trash} alt="" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-x-2 items-start p-4">
        <div className="pt-1 w-12">
          <img src={allImgPaths.KE} alt="KE" className="object-contain" />
        </div>
        <div className="w-full">
          {isEditTitle ? (
            <Textarea
              className="!p-0 resize-none"
              name="title"
              rows={2}
              value={text}
              onEnter={() => {
                updateName();
              }}
              onChange={(value) => {
                setText(value.target.value);
              }}
            />
          ) : (
            <span className="italic font-normal text-tertiary-900 line-clamp-2">
              {text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const KnowledgeEntryList = ({
  onSave = () => {},
  documentList,
  setDocumentList,
  onBack,
  accessControl,
  setShowAccessControlWarning,
  submittingNewKE,
  setSubmittingNewKE,
}: {
  onSave: (status: string) => void;
  documentList: any[];
  setDocumentList: any;
  typeOfKE?: "SINGLE" | "BULK";
  onBack: any;
  accessControl: any;
  setShowAccessControlWarning: any;
  submittingNewKE: any;
  setSubmittingNewKE: any;
}) => {
  const { translate } = useTranslate();

  const [status, setStatus] = useState("");
  // const fileInputRef = useRef<HTMLInputElement>(null);

  const { submitKE, isCreating, removeDocumentByIds, generateDocumentChunk } =
    useAppState(RootState.KE);

  const {
    user: { is_entity_enabled = false },
  } = useAppState(RootState.AUTH);

  const onBackButtonClick = () => {
    onBack && onBack();
  };

  const onPublish = async (status: string) => {
    onSave(status);
  };

  const deleteAllDocuments = () => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <Modal size="md" show={true} onClose={onClose}>
            <div className="flex flex-col gap-y-10">
              <div>
                <div className="flex justify-center">
                  <img src={allImgPaths.fileIcon} alt="file-icon" />
                </div>
                <div className="mt-4">
                  <p className="text-base font-medium text-center">
                    {translate("KEs.deleteDocumentsMsg")}
                  </p>
                </div>
              </div>
              <div className="flex gap-x-5 justify-center">
                <div>
                  <ButtonV2 onClick={onClose} variant="tertiaryDark">
                    {translate("common.cancel")}
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    onClick={async () => {
                      documentList.map((document) => {
                        document.cancelTokenSource?.cancel();

                        if (document.documentId) {
                          removeDocumentByIds([document.documentId]);
                        }
                      });

                      setDocumentList([]);
                      onClose();
                    }}
                    variant="error"
                    rightIcon={allImgPaths.rightArrow}
                  >
                    {translate("common.delete")}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </Modal>
        );
      },
    });
  };

  const removeFile = (document: {
    file: File;
    documentId: string;
    id: string;
    cancelTokenSource: any;
  }) => {
    const { documentId, cancelTokenSource, id } = document;

    setDocumentList((prev: any) => {
      return prev.filter(({ id: fileId }: any) => fileId !== id);
    });

    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }

    if (documentId) {
      removeDocumentByIds([documentId]);
    }
  };

  return (
    <div className="h-[calc(100vh_-_73px)] flex justify-center">
      <div className="relative px-14 py-8 w-full">
        <div
          style={{
            boxShadow: "0px 0px 18px 4px #eee",
          }}
          className="flex overflow-hidden relative flex-col w-full rounded-2xl border"
        >
          <div className="flex sticky top-0 justify-between items-center px-4 py-5 w-full text-lg font-semibold text-gray-700 bg-header">
            {translate("KEs.title")}
            <div>{accessControl}</div>
          </div>

          {size(documentList) > 0 && (
            <div className="flex justify-between px-6 py-2 shadow-md">
              <div className="flex">
                <span className="text-base font-semibold text-gray-700">
                  {size(documentList)} {translate("KEs.title")}
                </span>
              </div>
              <div className="flex cursor-pointer" onClick={deleteAllDocuments}>
                <span className="text-base font-semibold text-secondary-800">
                  {translate("common.delete-all")}
                </span>
              </div>
            </div>
          )}
          <div className="p-6 h-[calc(100vh_-_380px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {documentList.map((document: any, index: number) => (
                <BulkKECreation
                  file={document.file}
                  fileName={get(document, "file.name", "N/A")}
                  onDelete={() => removeFile(document)}
                  onChange={(name: string) => {
                    const _documentList = [...documentList];
                    _documentList[index].name = name;
                    setDocumentList(_documentList);
                  }}
                  key={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DrawerFooter className="absolute bottom-0">
        <div className="flex gap-x-6 justify-end items-center w-full">
          <div className="flex gap-x-6 items-center">
            <ButtonV2
              type="button"
              variant="tertiaryDark"
              onClick={onBackButtonClick}
            >
              {translate("common.back")}
            </ButtonV2>
            <ButtonV2
              disabled={
                (status === SAVE_MODE.DRAFT && isCreating) ||
                size(documentList) <= 0
              }
              type="button"
              loading={status === SAVE_MODE.DRAFT && isCreating}
              variant="secondary"
              rightIcon={allImgPaths.rightArrow}
              onClick={() => onPublish(SAVE_MODE.DRAFT)}
            >
              {translate("common.saveAsDraft")}
            </ButtonV2>
            <ButtonV2
              disabled={
                (status === SAVE_MODE.PUBLISHED && isCreating) ||
                size(documentList) <= 0
              }
              type="button"
              loading={status === SAVE_MODE.PUBLISHED && isCreating}
              variant="primary"
              rightIcon={allImgPaths.rightArrow}
              onClick={() => {
                if (submittingNewKE) {
                  setShowAccessControlWarning(true);
                } else {
                  onPublish(SAVE_MODE.PUBLISHED);
                }
                setSubmittingNewKE(false);
              }}
            >
              {translate("common.publish")}
            </ButtonV2>
          </div>
        </div>
      </DrawerFooter>
    </div>
  );
};

export default KnowledgeEntryList;
