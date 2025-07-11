import allImgPaths from "@/assets";
import { Dropdown, RenderDate } from "@/components";
import { useTranslate } from "@/hooks";
import { FILE_FORMATS_TOOLTIP_CONTENT, FILE_ICONS } from "@/shared/constants";
import { timeToSeconds } from "@/shared/functions";
import { filter, flatMap, get, has, map, size } from "lodash-es";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * Define date range filter options structure
 */
const DATE_RANGE_FILTER_OPTIONS = [
  {
    labelKey: "chats.retrievalDocs.dateFilter.allTime",
    value: "all_time",
    startDate: "",
    endDate: "",
  },
  {
    labelKey: "chats.retrievalDocs.dateFilter.today",
    value: "today",
    startDate: moment().startOf("day").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    labelKey: "chats.retrievalDocs.dateFilter.thisWeek",
    value: "this_week",
    startDate: moment().startOf("week").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    labelKey: "chats.retrievalDocs.dateFilter.thisMonth",
    value: "this_month",
    startDate: moment().startOf("month").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    labelKey: "chats.retrievalDocs.dateFilter.lastThreeMonths",
    value: "last_3_months",
    startDate: moment().startOf("month").subtract(3, "months").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    labelKey: "chats.retrievalDocs.dateFilter.thisYear",
    value: "this_year",
    startDate: moment().startOf("year").toISOString(),
    endDate: moment().toISOString(),
  },
];

interface SourceDocumentCardProps {
  document_id: string;
  knowledge_entry_id: string;
  type: string;
  file_name: string;
  description: string;
  score: number;
  metadata: any;
  ke_title: string;
  isHighlighted?: boolean;
  isDeleted?: boolean;
  updated_at?: string;
}

const SourceDocumentCard = ({
  document_id,
  knowledge_entry_id,
  type,
  file_name,
  description,
  score,
  metadata,
  ke_title,
  isDeleted = false,
  isHighlighted = false,
  updated_at,
}: SourceDocumentCardProps) => {
  const [, setSearchParams] = useSearchParams();
  const { translate } = useTranslate();
  const fileType = file_name?.split(".").pop()?.toLowerCase() || "KE";

  const icon = FILE_ICONS[fileType] ?? allImgPaths.KEIcon;
  return (
    <div
      onClick={() => {
        const pages: number[] = [];
        const timeRange: { start: number; end: number }[] = [];

        get(metadata, "chunks", []).forEach((chunk: any) => {
          if (has(chunk, "chunk_metadata.page")) {
            pages.push(chunk.chunk_metadata.page);
          }
        });

        get(metadata, "chunks", []).forEach((chunk: any) => {
          if (has(chunk, "chunk_metadata.start_time")) {
            timeRange.push({
              start: timeToSeconds(chunk.chunk_metadata.start_time),
              end: timeToSeconds(chunk.chunk_metadata.end_time),
            });
          }
        });

        setSearchParams({
          KEId: knowledge_entry_id,
          documentId: `${document_id ?? ""}`,
          viewer: "true",
          page: `${get(metadata, "chunks[0].chunk_metadata.page", 1)}`,
          ...(pages.length > 0 && {
            refPages: JSON.stringify(flatMap(pages)),
          }),
          ...(timeRange.length > 0 && {
            timeRange: JSON.stringify(timeRange),
          }),
        });
      }}
    >
      <div
        className={`group border duration-300 flex flex-col gap-0.5 gap-y-2 rounded-xl px-3 py-2.5 hover:shadow-sm cursor-pointer ${isHighlighted ? "bg-secondary-100 border-secondary-200 hover:border-secondary-500 hover:bg-secondary-200" : "bg-[#fdfdfd]  border-tertiary-50 hover:border-tertiary-100 hover:bg-tertiary-50/70"}`}
      >
        <div className="flex gap-x-1 items-center text-lg">
          <div
            className={`flex gap-x-1 items-center px-2 pr-3 py-1 text-sm bg-white rounded-full border line-clamp-1 ${isHighlighted ? "border-secondary-200" : "text-tertiary-400"} w-fit text-secondary-900`}
          >
            <img
              alt="Website favicon"
              className={`object-cover w-4 h-4 rounded-full opacity-100 duration-200 ${isHighlighted ? "" : "filter grayscale"}`}
              src={icon}
            />
            <p className="font-semibold uppercase truncate w-fit">{fileType}</p>
          </div>
          <div className="font-medium line-clamp-1">
            <p className="line-clamp-1">{document_id ? file_name : ke_title}</p>
            {isDeleted && (
              <span className="text-xs text-status-error">
                ({translate("common.deleted")})
              </span>
            )}
          </div>
        </div>
        <div className="text-sm font-normal leading-snug text-token-text-secondary line-clamp-2">
          {description}
        </div>
        <div className="min-h-5">
          <div
            className={`group-hover:opacity-100 opacity-0 duration-150 flex justify-between items-center mt-2 text-sm text-token-text-tertiary ${isHighlighted ? "text-secondary-900" : "text-tertiary-400"}`}
          >
            <div>{updated_at && <RenderDate value={updated_at ?? ""} />}</div>
            <div>
              <span>
                {translate("chats.retrievalDocs.relevance" as any)}:{" "}
                {parseFloat(`${(score || 0) * 100}`).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RetrievalDocs = ({
  onClose,
  relatedDocuments,
  sourceDocuments,
}: {
  onClose: () => void;
  relatedDocuments: any[];
  sourceDocuments: any[];
}) => {
  const { translate } = useTranslate();
  const params: any = useParams();

  const [sort, setSort] = useState({
    label: "",
    value: "",
  });

  const [dateFilter, setDateFilter] = useState({
    label: "",
    value: "",
    startDate: "",
    endDate: "",
  });

  const documents = flatMap(
    FILE_FORMATS_TOOLTIP_CONTENT.documents.map((file) => file.extension),
  );
  const images = flatMap(
    FILE_FORMATS_TOOLTIP_CONTENT.images.map((file) => file.extension),
  );
  const videos = flatMap(
    FILE_FORMATS_TOOLTIP_CONTENT.videos.map((file) => file.extension),
  );

  useEffect(() => {
    setSort({
      label: "",
      value: "",
    });
    setDateFilter({
      label: "",
      value: "",
      startDate: "",
      endDate: "",
    });
  }, [params.id, relatedDocuments, sourceDocuments]);

  // Map the date range options to include translated labels
  const translatedDateRangeOptions = DATE_RANGE_FILTER_OPTIONS.map(
    (option) => ({
      ...option,
      label: translate(option.labelKey as any),
    }),
  );

  const detectType = (doc: any) => {
    if (size(doc.document_id) && size(doc.file_url)) {
      return doc.file_url && doc.file_url.split(".").pop();
    } else if (size(doc.ke_title)) {
      return "KE";
    } else {
      return "";
    }
  };

  /**
   * Processes document list by sorting and adding type information
   * @param documents - Array of documents to process
   * @returns Processed documents array with type information
   */
  const processDocumentsList = (documents: any[]) => {
    try {
      return documents.map((doc) => ({
        ...doc,
        type: detectType(doc),
      }));
    } catch (error) {
      console.error("processDocumentsList Error:", error);
      return documents;
    }
  };

  /**
   * Filters documents based on date range
   * @param docs - Array of documents to filter
   * @returns Filtered documents array based on date range
   */
  const filterByDateRange = (docs: any[]) => {
    try {
      if (!dateFilter.value || dateFilter.value === "all_time") {
        return docs;
      }

      return docs.filter((doc) => {
        const docDate = doc.updated_at ? moment(doc.updated_at) : null;
        if (!docDate) return true; // Include documents without dates

        const startDate = dateFilter.startDate
          ? moment(dateFilter.startDate)
          : null;
        const endDate = dateFilter.endDate ? moment(dateFilter.endDate) : null;

        if (startDate && endDate) {
          return docDate.isBetween(startDate, endDate, null, "[]"); // [] means inclusive
        }
        return true;
      });
    } catch (error) {
      console.error("filterByDateRange Error:", error);
      return docs;
    }
  };

  const sourceDocumentsList = useMemo(() => {
    const _sourceDocuments = processDocumentsList(sourceDocuments);
    let filteredDocs = _sourceDocuments;

    // Apply type filter
    if (sort.value) {
      let filterFiles: string[] = [];
      if (sort.value === "documents") {
        filterFiles = documents;
      } else if (sort.value === "images") {
        filterFiles = images;
      } else if (sort.value === "videos") {
        filterFiles = videos;
      } else if (sort.value === "KE") {
        filterFiles = ["KE"];
      }

      filteredDocs = filter(filteredDocs, (doc) =>
        filterFiles.includes(doc.type),
      );
    }

    // Apply date filter
    filteredDocs = filterByDateRange(filteredDocs);

    return filteredDocs;
  }, [sourceDocuments, sort, dateFilter]);

  const relatedDocumentsList = useMemo(() => {
    const _relatedDocuments = processDocumentsList(relatedDocuments);
    let filteredDocs = _relatedDocuments;

    // Apply type filter
    if (sort.value) {
      let filterFiles: string[] = [];
      if (sort.value === "documents") {
        filterFiles = documents;
      } else if (sort.value === "images") {
        filterFiles = images;
      } else if (sort.value === "videos") {
        filterFiles = videos;
      } else if (sort.value === "KE") {
        filterFiles = ["KE"];
      }

      filteredDocs = filter(filteredDocs, (doc) =>
        filterFiles.includes(doc.type),
      );
    }

    // Apply date filter
    filteredDocs = filterByDateRange(filteredDocs);

    return filteredDocs;
  }, [relatedDocuments, sort, dateFilter]);

  const filterDropdownOption = useMemo(() => {
    const listOfAllSources = processDocumentsList([
      ...relatedDocuments,
      ...sourceDocuments,
    ]);

    const fileExtensions = map(
      listOfAllSources,
      (doc: any) => doc?.file_url,
    ).map((url: string) => (url && url.split(".").pop()) ?? "KE");

    const documentsList = filter(fileExtensions, (ext) =>
      documents.includes(ext),
    );
    const imagesList = filter(fileExtensions, (ext) => images.includes(ext));

    const KEs = filter(fileExtensions, (ext) => ["KE"].includes(ext));

    const videosList = filter(fileExtensions, (ext) => videos.includes(ext));

    const options = [
      {
        label: translate("chats.retrievalDocs.allFiles" as any),
        value: "",
      },
    ];

    if (KEs.length > 0) {
      options.push({
        label: translate("chats.retrievalDocs.KEs" as any),
        value: "KE",
      });
    }

    if (documentsList.length > 0) {
      options.push({
        label: translate("chats.retrievalDocs.documents" as any),
        value: "documents",
      });
    }

    if (imagesList.length > 0) {
      options.push({
        label: translate("chats.retrievalDocs.images" as any),
        value: "images",
      });
    }

    if (videosList.length > 0) {
      options.push({
        label: translate("chats.retrievalDocs.videos" as any),
        value: "videos",
      });
    }

    return options;
  }, [
    relatedDocuments,
    relatedDocumentsList,
    sourceDocumentsList,
    sourceDocuments,
  ]);

  return (
    <>
      <div className="overflow-hidden w-full rounded-2xl border">
        <div className="flex justify-between items-center p-4 shadow-sm">
          <div>
            <span className="text-lg font-medium">
              {translate("chats.retrievalDocs.heading")}
            </span>
          </div>
          <div
            onClick={onClose}
            className="flex justify-center items-center p-2 ml-4 rounded-full duration-500 cursor-pointer hover:bg-tertiary-50"
          >
            <img src={allImgPaths.closeIcon} alt="close" />
          </div>
        </div>
        <div className="flex gap-x-2 px-4 mt-4">
          <Dropdown
            className="min-w-[163px]"
            listClassName="max-h-full"
            label={(sort && sort?.label) || filterDropdownOption[0].label}
            items={filterDropdownOption}
            onSelect={(item: any) => {
              setSort(item);
            }}
          />
          <Dropdown
            className="min-w-[163px]"
            listClassName="max-h-full"
            label={
              (dateFilter && dateFilter?.label) ||
              translate(DATE_RANGE_FILTER_OPTIONS[0].labelKey as any)
            }
            items={translatedDateRangeOptions}
            onSelect={(item: any) => {
              setDateFilter(item);
            }}
          />
        </div>
        <div className="flex justify-between items-center px-4 mt-4">
          <div>
            {size(sourceDocumentsList) > 0 && (
              <span className="font-medium">
                {translate("chats.retrievalDocs.sourcesUsed" as any)}
              </span>
            )}
          </div>
        </div>
        <div className="h-[calc(100vh_-_310px)] overflow-auto flex flex-col gap-y-2 ">
          <>
            {size(sourceDocumentsList) > 0 && (
              <div className="flex flex-col gap-y-2 p-4">
                {sourceDocumentsList.map(
                  (
                    {
                      document_id,
                      knowledge_entry_id,
                      type,
                      file_name,
                      description,
                      score,
                      metadata,
                      ke_title,
                      is_deleted = false,
                      updated_at,
                    },
                    index,
                  ) => {
                    let startTime = 0;
                    let endTime = 0;

                    if (has(metadata, "start_time")) {
                      startTime = timeToSeconds(get(metadata, "start_time", 0));
                    }
                    if (has(metadata, "end_time")) {
                      endTime = timeToSeconds(get(metadata, "end_time", 0));
                    }

                    return (
                      <SourceDocumentCard
                        isDeleted={is_deleted}
                        updated_at={updated_at}
                        isHighlighted={true}
                        key={index}
                        document_id={document_id}
                        knowledge_entry_id={knowledge_entry_id}
                        type={type}
                        file_name={file_name}
                        description={description}
                        score={score}
                        metadata={metadata}
                        ke_title={ke_title}
                      />
                    );
                  },
                )}
              </div>
            )}
            {size(sourceDocumentsList) > 0 &&
              size(relatedDocumentsList) > 0 && (
                <div className="flex items-center px-4">
                  <div>
                    <h2 className="font-medium">
                      {translate("chats.retrievalDocs.otherFindings" as any)}
                    </h2>
                    <span className="text-sm italic text-tertiary-900">
                      {translate(
                        "chats.retrievalDocs.otherFindingsDescription" as any,
                      )}
                    </span>
                  </div>
                </div>
              )}

            <div className="flex flex-col gap-y-2 p-4">
              {relatedDocumentsList.map(
                (
                  {
                    document_id,
                    knowledge_entry_id,
                    type,
                    file_name,
                    description,
                    score,
                    metadata,
                    ke_title,
                    is_deleted = false,
                    updated_at,
                  },
                  index,
                ) => {
                  let startTime = 0;
                  let endTime = 0;

                  if (has(metadata, "start_time")) {
                    startTime = timeToSeconds(get(metadata, "start_time", 0));
                  }
                  if (has(metadata, "end_time")) {
                    endTime = timeToSeconds(get(metadata, "end_time", 0));
                  }

                  return (
                    <div key={index}>
                      <SourceDocumentCard
                        isDeleted={is_deleted}
                        updated_at={updated_at}
                        key={index}
                        document_id={document_id}
                        knowledge_entry_id={knowledge_entry_id}
                        type={type}
                        file_name={file_name}
                        description={description}
                        score={score}
                        metadata={metadata}
                        ke_title={ke_title}
                      />
                    </div>
                  );
                },
              )}
            </div>
          </>
        </div>
      </div>
    </>
  );
};

export default RetrievalDocs;
