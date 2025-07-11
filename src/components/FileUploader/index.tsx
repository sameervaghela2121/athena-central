import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { countBy, map, size } from "lodash-es";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import {
  FILE_UPLOAD_STATUS,
  MAX_FILE_UPLOADS_SIZE_LIMIT,
} from "@/shared/constants";
import { formatSizeUnits, removeExtension } from "@/shared/functions";
import { ButtonV2, Tooltip } from "..";
import Modal from "../Modal";
import FileList from "./FileList";

type StatusRecord = Record<"COMPLETED" | "IN_PROGRESS" | "PENDING", number>;

const FileUploader = ({
  selectedFiles = [],
  onChange,
  className = "",
  listContainerClass = "",
  accept = {},
  onDelete,
  disabled = false,
  maxSize = MAX_FILE_UPLOADS_SIZE_LIMIT.SINGLE,
  onClose,
}: {
  selectedFiles: any[] | undefined;
  onChange: (files: any[]) => void;
  accept?: any;
  className?: string;
  disabled?: boolean;
  listContainerClass?: string;
  onDelete?: (file: any) => void;
  maxSize?: number;
  onClose?: () => void;
}) => {
  const { removeDocumentByIds } = useAppState(RootState.KE);
  const [isDragActive, setIsDragActive] = useState(false); // To show feedback when dragging
  const { translate } = useTranslate();

  const removeFile = (document: {
    file: File;
    documentId: string;
    id: string;
    cancelTokenSource: any;
  }) => {
    const { file, documentId, cancelTokenSource, id } = document;

    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }

    onDelete && onDelete({ file, id, cancelTokenSource, documentId });

    if (documentId) {
      removeDocumentByIds([documentId]);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter out any files that have already been selected (by name and size)

      const newFiles = acceptedFiles
        .filter(
          (newFile) =>
            !selectedFiles.some(
              ({ file, status }: any) =>
                file.name === newFile.name &&
                file.size === newFile.size &&
                status !== FILE_UPLOAD_STATUS.DELETED,
            ),
        )
        .map((file) => {
          return {
            id: file.name + Date.now(),
            file,
            name: removeExtension(file.name),
            status: FILE_UPLOAD_STATUS.PENDING,
            cancelTokenSource: axios.CancelToken.source(), // Create a new CancelToken source for each file
            progress: 0,
          };
        });

      const oldFiles = [...selectedFiles];
      const _files = [...oldFiles, ...newFiles];

      if (newFiles.length) {
        onChange(_files);
      }
      setIsDragActive(false);
    },
    [selectedFiles],
  );

  const { getRootProps, getInputProps, fileRejections, open } = useDropzone({
    onDrop,
    // noClick: true, // Prevent the dropzone from responding to clicks
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: accept,
    maxSize: maxSize,
    disabled: disabled,
  });

  useEffect(() => {
    fileRejections.forEach((element) => {
      element.errors.forEach((err) => {
        if (err.code === "file-too-large") {
          toast.error(`File is larger than ${formatSizeUnits(`${maxSize}`)}`, {
            id: "file-size-error",
          });
        }

        if (err.code === "file-invalid-type") {
          toast.error(
            `Error: Unsupported file type. Please upload a valid file (e.g., .pdf, .docx, .xlsx, .jpg, .mp4).`,
            { id: "file-type-error" },
          );
        }
      });
    });
  }, [fileRejections]);

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
                      const documentIds = map(selectedFiles, "documentId");

                      if (size(documentIds)) {
                        removeDocumentByIds(documentIds);
                      }

                      selectedFiles.map((document) => {
                        document.cancelTokenSource?.cancel();
                      });

                      onChange([]);
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

  /**
   * Animation variants for the container of file items
   * Uses staggered children animations for a smooth sequence
   */
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Slightly faster stagger for smoother sequence
        delayChildren: 0.1, // Reduced delay for better responsiveness
      },
    },
  };

  /**
   * Animation variants for individual file items
   * Uses spring physics for natural movement
   */
  const item = {
    hidden: {
      y: 15, // Start slightly below final position
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    visible: {
      y: 0, // Move to final position
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300, // Higher stiffness for snappier animation
        damping: 25, // Balanced damping for slight bounce
        mass: 0.8, // Slightly lighter mass for faster movement
      },
    },
    exit: {
      opacity: 0,
      y: -10, // Exit upward for a nice removal effect
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  const uploadSummary = useMemo(() => {
    return countBy(selectedFiles, "status") as StatusRecord;
  }, [selectedFiles]);

  return (
    <div
      className={`flex overflow-hidden flex-col justify-start items-center p-4 w-full rounded-lg ${className}`}
    >
      {!disabled && (
        <div
          {...getRootProps({
            className: `!w-full h-full ${isDragActive ? "animated-border border-status-brand" : "border-2 border-dashed border-gray-300 border-gray-300"} dropzone ${size(selectedFiles) > 0 ? "max-h-[300px]" : ""} flex item-center justify-center cursor-pointer rounded-lg mb-6`,
          })}
        >
          <input {...getInputProps()} type="file" className="hidden" />

          <label className="flex flex-col justify-center items-center w-full h-full cursor-pointer">
            <img src={allImgPaths.upload} alt="upload" />
            <p className="text-sm text-gray-600">
              <a href="#" className="text-blue-600 hover:underline">
                {translate("common.browse-files")}{" "}
              </a>
            </p>
          </label>
        </div>
      )}

      {size(selectedFiles) > 0 && (
        <div className="flex justify-between pb-2 w-full h-">
          <div className="flex">
            <div className="flex items-center text-base font-semibold text-gray-700">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={size(selectedFiles) ? size(selectedFiles) : "empty"}
                  initial={{ y: 10, opacity: 0, scale: 1.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -10, opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="mr-1"
                >
                  {size(selectedFiles)}
                </motion.div>
              </AnimatePresence>
              <span>{translate("common.documents")}</span>
            </div>
          </div>
          {!disabled && (
            <div className="flex cursor-pointer" onClick={deleteAllDocuments}>
              <span className="text-base font-semibold text-status-error">
                {translate("common.delete-all")}
              </span>
            </div>
          )}
        </div>
      )}

      {size(selectedFiles) > 0 && (
        <motion.div
          className={`grid overflow-y-auto flex-wrap gap-4 content-start items-start pb-4 w-full sm:grid-cols-1 xl:grid-cols-2 h-[calc(100vh_-_0px)] ${listContainerClass}`}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {selectedFiles.map((document, index) => (
              <motion.div
                key={index}
                className="item min-w-[420px]"
                variants={item}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <FileList
                  disabled={disabled}
                  key={index}
                  file={document.file}
                  progress={document.progress ?? 0}
                  removeFile={() => {
                    if (disabled) return;
                    removeFile(document);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {onClose && size(selectedFiles) > 0 && (
        <div className="flex gap-x-6 justify-end items-center w-full">
          <Tooltip content={"Confirm attachment and return to previous screen"}>
            <ButtonV2
              variant={"primary"}
              // loading={size(selectedFiles) !== uploadSummary.COMPLETED}
              // disabled={size(selectedFiles) !== uploadSummary.COMPLETED}
              onClick={onClose}
            >
              {translate("common.done")}
            </ButtonV2>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default React.memo(FileUploader);
