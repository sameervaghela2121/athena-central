import allImgPaths from "@/assets";
import { Dropdown, IconButton } from "@/components";
import MultiLevelDropdown from "@/components/MultiLevelDropdown";
import { useTranslate } from "@/hooks";
import { CHAT_DATE_RANGE, CHAT_FILE_TYPES } from "@/shared/constants";
import { QuestionSchema } from "@/validations";
import { yupResolver } from "@hookform/resolvers/yup";
import { compact, includes, size } from "lodash-es";
import moment from "moment";
import React, { useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { Controller, useForm } from "react-hook-form";

export type DateRange = {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
};

export type FileType = {
  label: string;
  value: string;
};

interface ChatInputProps {
  onSubmit: (data: {
    question: string;
    fileType: string[];
    dateRange: DateRange;
  }) => void;
  isLoadingNewMessage: boolean;
  resizeElement: (id: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  chatFilter: { fileType: Record<string, string[]>; dateRange: DateRange };
  setChatFilter: (filter: any) => void;
}

const ChatInput = ({
  onSubmit,
  isLoadingNewMessage,
  resizeElement,
  autoFocus = false,
  disabled = false,
  chatFilter,
  setChatFilter,
}: ChatInputProps) => {
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { question: "" },
    mode: "all",
    reValidateMode: "onChange",
    resolver: yupResolver(QuestionSchema),
  });

  const { question } = watch();

  const { translate } = useTranslate();
  const [fileType, setFileType] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(chatFilter.dateRange);
  const [customDateRange, setCustomDateRange] = useState<any[]>([]);
  const [isShowDatePicker, setIsShowDatePicker] = useState<boolean>(false);

  const ref = useRef<DatePicker>(null);

  /**
   * Handles the insertion of a new line when Ctrl+Enter is pressed
   * @param e - Keyboard event
   * @param onChange - Form field onChange handler
   */
  const handleNewLineInsertion = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    onChange: (...event: any[]) => void,
  ) => {
    const { selectionStart, selectionEnd, value } = e.currentTarget;
    e.currentTarget.value =
      value.substring(0, selectionStart) + value.substring(selectionEnd);
    e.currentTarget.selectionStart = e.currentTarget.selectionEnd =
      selectionStart + 1;
    onChange(e);
  };

  /**
   * Directly submits the form with the current textarea value on Enter key press
   * @param e - Keyboard event
   */
  const handleEnterSubmission = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    e.preventDefault();

    const currentValue = e.currentTarget.value;

    // Only submit if there's actual content
    if (currentValue.trim()) {
      try {
        onSubmit({
          question: currentValue,
          fileType: fileType,
          dateRange: dateRange,
        });
      } catch (error) {
        console.error("handleEnterSubmission Error:", error);
      } finally {
        reset();
      }
    }
  };

  /**
   * Handles keyboard events for the chat input textarea
   * @param e - Keyboard event
   * @param onChange - Form field onChange handler
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    onChange: (...event: any[]) => void,
  ) => {
    if (isLoadingNewMessage || e.key !== "Enter") return;

    e.shiftKey ? handleNewLineInsertion(e, onChange) : handleEnterSubmission(e);
  };

  /**
   * Handles form submission with data from the form and resets the form
   * @param data - Form data containing the question
   */
  const handleSubmitWithReset = (data: { question: string }) => {
    if (isLoadingNewMessage) return;

    try {
      onSubmit({
        ...data,
        fileType: fileType,
        dateRange: dateRange,
      });
    } catch (error) {
      console.error("handleSubmitWithReset Error:", error);
    } finally {
      reset();
    }
  };

  const dateRangePicker = (
    value:
      | "today"
      | "yesterday"
      | "last7Days"
      | "last30Days"
      | "thisMonth"
      | "thisYear",
  ) => {
    let startDate, endDate;

    endDate = new Date(moment().endOf("day").toISOString());
    switch (value) {
      case "today": {
        startDate = new Date(moment().startOf("day").toISOString());
        break;
      }
      case "yesterday": {
        startDate = new Date(moment().add("day", -1).toISOString());
        endDate = new Date(moment().add("day", -1).endOf("day").toISOString());
        break;
      }
      case "last7Days": {
        startDate = new Date(moment().add("day", -7).toISOString());
        break;
      }
      case "thisMonth": {
        startDate = new Date(moment().startOf("month").toISOString());
        break;
      }
      case "last30Days": {
        startDate = new Date(moment().add("day", -30).toISOString());
        break;
      }
      case "thisYear": {
        startDate = new Date(moment().startOf("year").toISOString());
        break;
      }
    }

    setCustomDateRange([startDate, endDate]);
    ref.current?.setOpen(false);
  };

  const onChangeDatePicker = (dates: any) => {
    const cleanedDates: Date[] = compact(dates);

    if (size(cleanedDates)) {
      setCustomDateRange(cleanedDates);
      setDateRange({
        label: "Custom",
        value: "custom",
        startDate: cleanedDates[0].toISOString(),
        endDate: cleanedDates[1].toISOString(),
      });
    } else {
      setIsShowDatePicker(false);
      setDateRange(CHAT_DATE_RANGE[0]);
    }
  };

  const isValidQuestion = useMemo(() => {
    return isLoadingNewMessage || disabled || !question?.trim();
  }, [isLoadingNewMessage, disabled, question]);
  return (
    <form onSubmit={handleSubmit(handleSubmitWithReset)}>
      <div className="overflow-hidden rounded-2xl border border-tertiary-200/50 shadow-customShadow1">
        <div
          className={`flex gap-x-2 items-center px-4 py-2 w-full bg-white  ${disabled ? "opacity-50" : ""}`}
        >
          <Controller
            name="question"
            control={control}
            render={({ field: { onChange, ...field }, formState }) => (
              <textarea
                autoFocus={autoFocus}
                id="chat-input"
                placeholder={`${translate("chats.askNewQuestionPlaceholder")}`}
                className="sm:placeholder:text-lg text-sm sm:text-base placeholder:font-normal placeholder:text-tertiary-400 flex-1 outline-none resize-none h-7 overflow-auto w-full sm:w-[calc(100%-4rem)] items-center max-h-12"
                {...field}
                rows={1}
                onChange={(e) => {
                  onChange(e);
                  resizeElement("chat-input");
                }}
                onKeyDown={(e) => handleKeyDown(e, onChange)}
                disabled={disabled}
              />
            )}
          />
        </div>
        <div className="flex gap-x-2 justify-between px-4 py-2 min-h-6">
          <div className="flex gap-x-1 items-center h-fit">
            <MultiLevelDropdown
              disabled={disabled}
              items={CHAT_FILE_TYPES}
              defaultValue={chatFilter.fileType}
              label={fileType.join(", ").replace("KE", "KEs") || "All Files"}
              onSelect={(selected: any) => {
                const payload: any = [];
                Object.entries(selected).map(([cat, opts]: any) => {
                  switch (cat) {
                    case "documents":
                      {
                        if (includes(opts, "*")) {
                          payload.push(
                            ...["pdf", "docs", "html", "txt", "ppt", "excel"],
                          );
                        } else {
                          payload.push(...opts);
                        }
                      }
                      break;
                    case "videos":
                      {
                        if (includes(opts, "*")) {
                          payload.push("video");
                        }
                      }
                      break;
                    case "images":
                      {
                        if (includes(opts, "*")) {
                          payload.push("image");
                        }
                      }
                      break;
                    case "KE Description":
                      {
                        if (includes(opts, "*")) {
                          payload.push("KE");
                        }
                      }
                      break;
                    default:
                      break;
                  }
                });

                setFileType(payload);
                setChatFilter({ ...chatFilter, fileType: selected });
              }}
              btnName="!py-1 !px-2"
              className=" !bg-white !p-1  max-w-36 truncate !min-w-max"
              listClassName="max-h-[260px] min-w-[200px]"
            />

            <>
              {!isShowDatePicker && (
                <Dropdown
                  disabled={disabled}
                  // className="!w-36 !bg-white"
                  // btnName={"!p-1"}
                  // listClassName="max-h-[260px]"
                  // btnName="!p-1 min-w-max"
                  btnName="!py-1 !px-2"
                  className="!bg-white !p-1  max-w-36 truncate !min-w-min"
                  listClassName="max-h-[260px] !min-w-[250px]"
                  items={CHAT_DATE_RANGE}
                  label={dateRange.label}
                  selectedItem={dateRange}
                  onSelect={(item: any) => {
                    if (item.value === "custom") {
                      // show date picker
                      setCustomDateRange([]);
                      setIsShowDatePicker(true);
                      ref.current?.setOpen(true);
                    }
                    setDateRange(item);
                    setChatFilter({ ...chatFilter, dateRange: item });
                  }}
                />
              )}

              <div
                className={`custom-datepicker ${isShowDatePicker ? "block" : "hidden"}`}
              >
                <DatePicker
                  ref={ref}
                  className="h-full !py-[11px] !px-2 w-full text-sm flex gap-x-2.5 justify-between rounded-lg font-medium text-tertiary-800 focus:outline-none border border-tertiary-50"
                  onChange={onChangeDatePicker}
                  placeholderText={"All Time"}
                  startDate={customDateRange[0] ? customDateRange[0] : null}
                  endDate={customDateRange[1] ? customDateRange[1] : null}
                  selectsRange
                  isClearable
                  showIcon
                  showMonthDropdown
                  showYearDropdown
                  icon={""}
                  maxDate={new Date()}
                  // inline
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex flex-col items-center px-2 mb-2">
                      <div className="flex justify-between items-center mb-4 w-full">
                        <button
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          className={`p-2 w-8 h-8 text-2xl rounded-full flex items-center justify-center hover:bg-secondary-300 ${
                            prevMonthButtonDisabled ? "opacity-50" : ""
                          }`}
                        >
                          <span>‹</span>
                        </button>
                        <span className="text-lg font-semibold">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "long",
                            year: "numeric",
                          }).format(date)}
                        </span>
                        <button
                          type="button"
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          className={`p-2 w-8 h-8 text-2xl rounded-full flex items-center justify-center hover:bg-secondary-300 ${
                            nextMonthButtonDisabled ? "opacity-50" : ""
                          }`}
                        >
                          <span>›</span>
                        </button>
                      </div>
                    </div>
                  )}
                />
              </div>
            </>
          </div>

          <div className="flex items-end sm:items-center">
            <IconButton
              type="submit"
              src={
                isValidQuestion
                  ? allImgPaths.rightArrowGrayIcon
                  : allImgPaths.rightWhiteIcon
              }
              className={`w-10 h-10 max-w-9 max-h-9 sm:h-14 sm:w-14 shrink-0 !px-2  text-primary-900 ${isValidQuestion ? "!bg-secondary-200" : "!bg-primary-900"}`}
              disabled={isValidQuestion}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default React.memo(ChatInput);
