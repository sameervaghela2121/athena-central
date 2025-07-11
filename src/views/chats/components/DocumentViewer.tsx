import { find, get, replace, size, sortBy } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ControlProps, components as RSComponents } from "react-select";
import { toast } from "sonner";

import api from "@/apis/KE";
import allImgPaths from "@/assets";
import {
  Drawer,
  DrawerFooter,
  EmptyState,
  IconButton,
  LoaderCircle,
  ReadMore,
  RenderDate,
  SelectComponent,
  TextFileViewer,
  Tooltip,
  VideoPlayer,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import {
  ACCESS_ROLE,
  ROLES,
  SAVE_MODE,
  fileIconMapper,
} from "@/shared/constants";
import { sanitizeCkEditorHtml } from "@/shared/functions";
import ImageViewer from "./ImageViewer";
import PdfViewer from "./PdfViewer";

interface DocumentViewerProps {
  show: boolean;
  onClose: () => void;
}
const DocumentViewer = ({ show = false, onClose }: DocumentViewerProps) => {
  const { documentDetails, setDocumentDetails } = useAppState(RootState.CHATS);
  const {
    user: { role = "" },
  } = useAppState(RootState.AUTH);
  const location = useLocation();
  const { translate } = useTranslate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [numPages, setNumPages] = useState<number>(0);
  const [showKE, setShowKE] = useState(false);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [inputPageNumber, setInputPageNumber] = useState<string>("1");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [KEData, setKEData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const queryParams = new URLSearchParams(location.search);

  let KEId: string = queryParams.get("KEId") as string;
  KEId = KEId === "new" ? "" : KEId;

  const documentId: any = queryParams.get("documentId") ?? "";

  const [pagesForSource, setPagesForSource] = useState<
    { label: string; value: string }[]
  >([]);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }[]>(
    [],
  );

  const page: any = queryParams.get("page") ?? "1";
  // const startTime: any = queryParams.get("startTime") ?? 0;
  // const endTime: any = queryParams.get("endTime") ?? 0;

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  const onDocumentLoadFailure = ({}: {}) => {
    setDocumentDetails({
      file_name: "",
      file_url: "",
      page: 1,
      signed_url: "",
    });
  };

  const fetchKEById = async (KEId: string) => {
    try {
      setIsLoading(true);
      const response: any = await api.getKEById(KEId);
      setKEData(get(response, "data.data.result", null));
    } catch (error) {
      console.error("fetchKEById error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (KEId) fetchKEById(KEId);
  }, [KEId]);

  useEffect(() => {
    const haveDocumentId = Boolean(documentId);

    setShowKE(!haveDocumentId);

    const refPages = JSON.parse(queryParams.get("refPages") || "[]");
    const timeRange = JSON.parse(queryParams.get("timeRange") || "[]");

    const options = refPages.map((page: any) => ({
      value: page,
      label: page,
    }));

    setTimeRange(timeRange);

    setPagesForSource(options);
  }, [documentId]);

  useEffect(() => {
    const _page = parseInt(page);

    if (!isNaN(_page) && _page <= numPages) {
      setPageNumber(_page);
      setInputPageNumber(_page.toString());
    } else {
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.set("page", !isNaN(_page) ? page : "1");
      setSearchParams(updatedParams);
      setPageNumber(parseInt(page));
      setInputPageNumber(parseInt(page).toString());
    }
  }, [documentDetails, page]);

  useEffect(() => {
    const updatedParams = new URLSearchParams(searchParams);
    updatedParams.set("page", !isNaN(pageNumber) ? `${pageNumber}` : "1");
    setSearchParams(updatedParams);
  }, [pageNumber]);

  const handlePageChange = async (action: string) => {
    let newPage: number;
    if (action === "prev") {
      newPage = pageNumber !== 1 ? pageNumber - 1 : 1;
      setPageNumber(newPage);
      setInputPageNumber(newPage.toString());
    } else if (action === "next") {
      newPage = pageNumber < numPages ? pageNumber + 1 : pageNumber;
      setPageNumber(newPage);
      setInputPageNumber(newPage.toString());
    }
  };

  /**
   * Handles the page number input change
   * @param e - Input change event
   */
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, "");
    setInputPageNumber(value);
  };

  /**
   * Validates and applies the page number from input
   */
  const applyPageNumberChange = () => {
    try {
      const newPage = parseInt(inputPageNumber);
      if (!isNaN(newPage) && newPage >= 1 && newPage <= numPages) {
        setPageNumber(newPage);
      } else {
        // Reset to current page if invalid
        setInputPageNumber(pageNumber.toString());
      }
      setIsEditing(false);
    } catch (error) {
      console.error("applyPageNumberChange Error:", error);
      setInputPageNumber(pageNumber.toString());
      setIsEditing(false);
    }
  };

  /**
   * Handles key press in the page input
   * @param e - Keyboard event
   */
  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyPageNumberChange();
    } else if (e.key === "Escape") {
      setInputPageNumber(pageNumber.toString());
      setIsEditing(false);
    }
  };

  const updateIndex = (documentId: string) => {
    const updatedParams = new URLSearchParams(searchParams); // Clone current parameters
    if (documentId) {
      updatedParams.set("documentId", documentId); // Update the `index`
    } else {
      updatedParams.delete("documentId"); // Update the `index`
      updatedParams.delete("page"); // Update the `index`
    }
    setSearchParams(updatedParams); // Update the URL with the new parameters
  };

  const checkIfDocumentIsPDF = (mimeType: string) => {
    return ["application/pdf", "application/x-pdf"].includes(mimeType);
  };

  const checkIfDocumentIsVideo = (mimeType: string) => {
    return [
      "video/mp4",
      "video/x-msvideo",
      "video/quicktime",
      "video/x-matroska",
      "video/webm",
      "video/vnd.avi",
    ].includes(mimeType);
  };

  const checkIfDocumentIsText = (mimeType: string) => {
    return ["text/plain"].includes(mimeType);
  };

  const checkIfDocumentIsImage = (mimeType: string) => {
    return [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/x-png",
    ].includes(mimeType);
  };

  const documents = sortBy(get(KEData, "documents", []), "type");

  const selectedDocument: any = useMemo(() => {
    const doc: any = find(documents, { document_id: documentId });

    return {
      ...doc,
      transcription_with_timestamps: get(
        doc,
        "transcription_with_timestamps.segments",
        [],
      ),
    };
  }, [documentId, documents]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      handlePageChange("next");
    } else if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      handlePageChange("prev");
    }
  };

  useEffect(() => {
    window.addEventListener("keyup", handleKeyDown);
    return () => {
      window.removeEventListener("keyup", handleKeyDown);
      toggleExpand();
    };
  }, [documents]);

  const canEditKE =
    get(KEData, "status", "") !== SAVE_MODE.PROCESSING &&
    ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role) ||
      ([ROLES.QUEUES_SUPPORT].includes(role) &&
        [ACCESS_ROLE.EDITOR, ACCESS_ROLE.OWNER].includes(
          get(KEData, "access_role", ACCESS_ROLE.VIEWER),
        )));

  const {
    transcription_with_timestamps: [],
  }: {
    transcription_with_timestamps: {
      end_time: string;
      start_time: string;
      text: string;
    }[];
  } = selectedDocument;

  const options = useMemo(() => {
    const pages = get(pagesForSource, "metadata.page", []);

    // create options from number array (pages) option object would be {value: 1, label: "Page 1"}
    const options = pages.map((page: number) => ({
      value: page,
      label: `Page ${page}`,
    }));

    return options;
  }, [pagesForSource]);

  const selectedRef = useMemo(() => {
    const selectedOption: any = find(pagesForSource, { value: pageNumber });

    if (!selectedOption) return null;

    return { ...selectedOption, label: `Page: ${selectedOption.label}` };
  }, [pagesForSource, pageNumber]);

  return (
    <Drawer
      show={show}
      size={showTranscript ? "xl" : "md"}
      onClose={onClose}
      icon={allImgPaths.rightIcon}
      title={
        <div className="flex gap-x-2 items-center">
          {showKE && documentId && (
            <div
              className="rounded-full duration-100 cursor-pointer hover:bg-tertiary-50"
              onClick={() => {
                const updatedParams = new URLSearchParams(searchParams); // Clone current parameters
                updatedParams.set("documentId", ""); // Update the `index`
                setSearchParams(updatedParams); // Update the URL with the new parameters
                setShowKE(true);
              }}
            >
              <img
                src={allImgPaths.rightArrowGrayIcon}
                className="rotate-180"
              />
            </div>
          )}
          <div>
            {showKE && KEData ? (
              <div className={`flex gap-1 items-center cursor-pointer`}>
                <Tooltip
                  place="top"
                  content={
                    <div className="max-w-md">
                      <p className="break-all">{get(KEData, "title", "")}</p>
                    </div>
                  }
                >
                  <span className="break-all max-w-80 lg:max-w-2xl line-clamp-1">
                    {get(KEData, "title", "")}
                  </span>
                </Tooltip>

                {canEditKE && (
                  <div className="flex">
                    <div className="p-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-white">
                      <Tooltip content={translate("common.edit")} color="dark">
                        <img
                          src={allImgPaths.editIcon}
                          alt=""
                          className="w-5 h-5"
                          onClick={() => {
                            if (canEditKE) {
                              (window as any)
                                .open(
                                  `${window.location.origin}/KEs?KEId=${get(KEData, "id", "")}&page=1`,
                                  "_blank",
                                  // "width=500,height=1000",
                                )
                                .focus();
                            }
                          }}
                        />
                      </Tooltip>
                    </div>
                    <div
                      className="p-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-white"
                      onClick={() => {
                        setIsCopied(true);
                        toast.info("Copied to clipboard", {
                          id: "copy",
                          position: "top-center",
                        });
                        setTimeout(() => {
                          setIsCopied(false);
                        }, 2000);
                        //  copy clipboard
                        navigator.clipboard.writeText(
                          `${window.location.origin}/KEs?KEId=${get(KEData, "id", "")}&page=1`,
                        );
                      }}
                    >
                      <Tooltip
                        content={
                          isCopied
                            ? translate("chats.documentViewer.copied")
                            : translate("chats.documentViewer.copy")
                        }
                        color="dark"
                      >
                        <img
                          src={
                            isCopied
                              ? allImgPaths.squareRightTickIcon
                              : allImgPaths.copyIconDark
                          }
                          alt=""
                          className="w-5 h-5"
                        />
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {KEData && (
                  <div className="flex flex-col gap-x-3 items-baseline sm:flex-row sm:items-start">
                    <div className="">
                      {translate("chats.documentViewer.heading")}
                    </div>
                    {size(pagesForSource) >= 1 &&
                      checkIfDocumentIsPDF(selectedDocument?.type) && (
                        <div className="flex gap-x-1 h-10">
                          <SelectComponent
                            value={selectedRef}
                            classNamePrefix={"reference"}
                            className="min-w-40"
                            menuPortalTarget={document.body}
                            placeholder={"View References"}
                            isSearchable={false}
                            options={pagesForSource}
                            components={{
                              Control: (vcProps: ControlProps<any>) => {
                                const { children } = vcProps;

                                return (
                                  <RSComponents.Control {...vcProps}>
                                    <div className="flex gap-x-2 items-center px-2 pr-0">
                                      <img src={allImgPaths.magnifier} />
                                      <div className="flex justify-between min-w-32">
                                        {children}
                                      </div>
                                    </div>
                                  </RSComponents.Control>
                                );
                              },
                              Option: ({ children, ...props }) => {
                                const data: any = props.data;

                                return (
                                  <div
                                    {...props.innerProps}
                                    className={`hover:border-l-primary-900 border-l-2 border-l-transparent flex flex-col custom-option gap-x-1 cursor-pointer hover:bg-tertiary-50 duration-300 p-2 ${props.isSelected ? "bg-secondary-200" : "bg-transparent"}`}
                                  >
                                    <div className="flex gap-x-2">
                                      <img
                                        src={allImgPaths.pdfIcon}
                                        alt="pdf"
                                      />
                                      <span className="text-base text-gray-900">
                                        {data.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              },
                              ClearIndicator: () => null,
                              IndicatorSeparator: () => null,
                            }}
                            isClearable={false}
                            closeMenuOnSelect={true}
                            onChange={(data: any) => {
                              setPageNumber(data.value);
                            }}
                          />
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-between">
        <div className="relative h-full">
          <div
            className={`${showKE ? "h-[calc(100vh_-_73px)]" : size(pagesForSource) > 1 && checkIfDocumentIsPDF(selectedDocument?.type) ? "h-[calc(100vh_-_170px)]" : checkIfDocumentIsImage(selectedDocument?.type) ? "h-[calc(100vh_-_155px)]" : "h-[calc(100vh_-_170px)]"} w-full flex justify-center items-center`}
          >
            {isLoading ? (
              !size(selectedDocument?.signed_url) &&
              !checkIfDocumentIsPDF(selectedDocument?.type) && (
                <LoaderCircle className="h-[calc(100vh_-_170px)]" />
              )
            ) : showKE ? (
              <div className="overflow-y-auto p-4 w-full h-full sm:px-14 sm:py-6 sm:overflow-y-hidden">
                {KEData ? (
                  <div className="flex flex-col gap-y-4 p-4 mt-2 rounded-2xl border">
                    <div>
                      <div>
                        <span className="text-lg font-semibold">
                          {translate("chats.documentViewer.KETitle")}:
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="break-all text-tertiary-800">
                          {get(KEData, "title", "")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      <div>
                        <span className="text-lg font-semibold">
                          {translate("chats.documentViewer.description")}:
                        </span>
                      </div>
                      <div className="mt-1 overflow-y-auto max-h-[calc(100vh_-_470px)]">
                        <div>
                          {size(
                            sanitizeCkEditorHtml(get(KEData, "content", "")),
                          ) > 0 ? (
                            <ReadMore
                              className="text-tertiary-800"
                              text={get(KEData, "content", "")}
                              limit={size(get(KEData, "content", ""))}
                            />
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>

                    {size(documents) > 0 && (
                      <div className="p-4 rounded-2xl border">
                        <div>
                          <span className="font-semibold">
                            {translate("common.documents")}:
                          </span>
                        </div>
                        <div className="flex flex-col gap-y-2 mt-1">
                          {documents.map((document: any, index: any) => (
                            <div
                              key={index}
                              className="flex overflow-hidden justify-between items-center px-2 py-2 rounded-lg transition-all duration-200 cursor-pointer text-ellipsis bg-tertiary-50 hover:bg-secondary-200"
                            >
                              <div className="flex gap-x-2">
                                <div className="flex gap-x-1 mr-2 shrink-0">
                                  {document.status === "FAILED" && (
                                    <Tooltip
                                      content={
                                        <div className="flex flex-col w-80">
                                          <div className="flex gap-x-2 items-start">
                                            <img
                                              src={allImgPaths.warningRedIcon}
                                              alt=""
                                              className="w-6 h-6"
                                            />
                                            <span className="">
                                              {document.failure_reason}
                                            </span>
                                          </div>
                                        </div>
                                      }
                                    >
                                      <img
                                        src={allImgPaths.warningRedIcon}
                                        alt=""
                                        className="w-6 h-6"
                                      />
                                    </Tooltip>
                                  )}
                                  <img
                                    src={
                                      fileIconMapper[document.type] ??
                                      allImgPaths.file
                                    }
                                    alt=""
                                    className="w-6 h-6"
                                  />
                                </div>
                                <div className="truncate !sm:truncate-reverse w-full">
                                  <span className="font-medium text-tertiary-700 text-wrap line-clamp-1">
                                    {replace(document.file_name, "_", " ")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-x-2">
                                {(checkIfDocumentIsVideo(document.type) ||
                                  checkIfDocumentIsPDF(document.type) ||
                                  checkIfDocumentIsImage(document.type) ||
                                  checkIfDocumentIsText(document.type)) && (
                                  <div
                                    className="cursor-pointer shrink-0"
                                    onClick={() => {
                                      updateIndex(document.document_id);
                                      setShowKE(false);
                                    }}
                                  >
                                    <img src={allImgPaths.eyeIconBlue} alt="" />
                                  </div>
                                )}
                                <div className="cursor-pointer shrink-0">
                                  <a
                                    className="flex gap-x-1 cursor-pointer"
                                    href={document?.signed_url}
                                  >
                                    <span className="text-status-brand">
                                      <img
                                        src={allImgPaths.downloadIcon}
                                        alt=""
                                      />
                                    </span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div>
                        <span className="text-lg font-semibold">
                          {translate("chats.documentViewer.updatedBy")}:
                        </span>
                      </div>
                      <div className="mt-1 truncate">
                        <span className="text-tertiary-800">
                          {`${get(KEData, "updated_by.name", "")}`}
                          <span
                            title={get(KEData, "updated_by.email", "")}
                            className="ml-1 text-tertiary-900"
                          >
                            ({get(KEData, "updated_by.email", "")})
                          </span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <span className="text-lg font-semibold">
                          {translate("chats.documentViewer.updatedAt")}:
                        </span>
                      </div>
                      <div className="mt-1">
                        <RenderDate value={get(KEData, "updated_at", "")} />
                        <span className="text-tertiary-800"></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center w-full h-full">
                    <EmptyState
                      description={"No KE found"}
                      imageUrl={allImgPaths.noRecord}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                {!selectedDocument && !isLoading ? (
                  <EmptyState
                    description={"No document found"}
                    imageUrl={allImgPaths.noRecord}
                  />
                ) : (
                  <div className="flex flex-col justify-start p-5 w-full h-full">
                    {size(selectedDocument?.signed_url) > 0 &&
                    checkIfDocumentIsPDF(selectedDocument?.type) ? (
                      <>
                        <PdfViewer
                          url={selectedDocument?.signed_url}
                          fileName={selectedDocument?.file_name}
                          pageNumber={pageNumber}
                          onDocumentLoadSuccess={onDocumentLoadSuccess}
                          onDocumentLoadFailure={onDocumentLoadFailure}
                          handlePageChange={handlePageChange}
                          currentPage={pageNumber}
                          numPages={numPages}
                        />
                      </>
                    ) : checkIfDocumentIsImage(selectedDocument.type) ? (
                      <ImageViewer
                        imageUrl={selectedDocument?.signed_url}
                        fileName={selectedDocument?.file_name || ""}
                        fileIcon={
                          fileIconMapper[selectedDocument?.type] ??
                          allImgPaths.file
                        }
                      />
                    ) : checkIfDocumentIsVideo(selectedDocument.type) ? (
                      <VideoPlayer
                        setShowTranscript={setShowTranscript}
                        src={selectedDocument?.signed_url}
                        id={selectedDocument?.id}
                        className="w-full h-full"
                        initStartFrom={0}
                        onEnded={() => {}}
                        highlightSegments={timeRange}
                        initialVolume={0.7}
                        autoPlay={false}
                        transcription={
                          selectedDocument.transcription_with_timestamps
                        }
                        fileName={selectedDocument?.file_name || ""}
                      />
                    ) : checkIfDocumentIsText(selectedDocument.type) ? (
                      <>
                        <TextFileViewer
                          fileUrl={selectedDocument?.signed_url}
                          fileName={selectedDocument?.file_name || ""}
                        />
                      </>
                    ) : (
                      <a
                        className="flex flex-col justify-center items-center h-full cursor-pointer"
                        href={selectedDocument?.signed_url}
                        target="_blank"
                      >
                        <div className="flex gap-x-2 justify-center">
                          <div className="flex flex-col gap-y-2 justify-center p-16 bg-white border-secondary-200 text-tertiary-800">
                            <div className="flex justify-center">
                              <img
                                src={allImgPaths.noPreview}
                                className="w-44"
                              />
                            </div>
                            <p className="text-center">
                              {translate("chats.documentViewer.noPreview")}
                            </p>
                            <p className="text-center">
                              {translate("chats.documentViewer.pleaseDownload")}
                            </p>
                            <div className="flex flex-col justify-center items-center animate-bounce">
                              <img
                                src={allImgPaths.downloadIcon}
                                className="w-8"
                              />
                            </div>
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {!showKE && selectedDocument && (
          <DrawerFooter className="justify-between p-6 min-h-[81px]">
            <div className="flex gap-x-3 items-center">
              <div>
                <a
                  className="flex gap-x-1 cursor-pointer"
                  target="_blank"
                  href={selectedDocument?.signed_url}
                >
                  <img src={allImgPaths.downloadIcon} />
                  <span className="hidden text-status-brand sm:block">
                    {translate("common.download")}
                  </span>
                </a>
              </div>
              <div
                className="flex gap-x-1 items-center cursor-pointer text-status-brand"
                onClick={() => {
                  updateIndex("");
                  setShowKE(true);
                }}
              >
                <img src={allImgPaths.eyeIconBlue} />
                <span className="hidden text-status-brand sm:block">
                  {translate("chats.documentViewer.showKE")}
                </span>
              </div>
            </div>
            <div>
              {numPages > 1 && selectedDocument?.file_name?.endsWith("pdf") && (
                <div className="flex gap-x-2 justify-center items-center text-xs text-tertiary-700 sm:text-base">
                  <div onClick={() => handlePageChange("prev")}>
                    <IconButton
                      className="cursor-pointer"
                      src={allImgPaths.pagiLeftArrow}
                      onMouseEnter={() => {
                        setDirection("DOWN");
                      }}
                      disabled={pageNumber <= 1}
                    />
                  </div>
                  <div className="flex gap-x-2 px-2 py-3 bg-white rounded-full sm:px-6">
                    <div>{translate("common.page")}</div>
                    <div>
                      <input
                        type="text"
                        value={inputPageNumber}
                        onChange={handlePageInputChange}
                        onBlur={applyPageNumberChange}
                        onKeyDown={handlePageInputKeyDown}
                        className="w-12 text-center rounded-md border outline-none"
                        autoFocus
                      />
                    </div>
                    <div>
                      {translate("common.of")} {numPages}
                    </div>
                  </div>
                  <div onClick={() => handlePageChange("next")}>
                    <IconButton
                      className="cursor-pointer"
                      src={allImgPaths.pagiRightArrow}
                      onMouseEnter={() => {
                        setDirection("UP");
                      }}
                      disabled={numPages === pageNumber}
                    />
                  </div>
                </div>
              )}
            </div>
          </DrawerFooter>
        )}
      </div>
    </Drawer>
  );
};

export default DocumentViewer;
