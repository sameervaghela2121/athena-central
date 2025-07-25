import axios from "axios";
import { get, has, size, uniq } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import { useLocation, useSearchParams } from "react-router-dom";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import allImgPaths from "@/assets";
import { Divider, Tooltip } from "@/components";
import { useAppState } from "@/context";
import { RootState } from "@/context/useAppState";
import { ROLES } from "@/shared/constants";

import { SourceButton } from "@/components/common";
import { useTranslate } from "@/hooks";
import CopyButton from "./CopyButton";
import DownVote from "./DownVote";
import UpVote from "./UpVote";

interface CustomAnchorProps {
  href: string;
  children: React.ReactNode;
}

// Custom anchor tag component
const CustomAnchor: any = ({ href }: CustomAnchorProps): any => {
  const [data, setData] = useState<any>(null);
  const [linkData, setLinkData] = useState<any>({
    src: href,
    title: href,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(
          `https://api.microlink.io/?url=${encodeURIComponent(href)}`,
        );

        if (data.statusCode !== 404) {
          if (data && data.data && data.data) {
            setData(data.data);
          }
        } else {
          setData(null);
          const url = new URL(href);
          const hostname = url.origin;
          setLinkData({
            src: href,
            title: hostname || href,
          });
        }
      } catch (error) {
        console.error("Error fetching URL:", error);
      }
    };
    fetchData();
  }, [href]);

  return (
    <div className="inline-flex gap-x-2">
      <Tooltip
        place="left"
        color="secondary"
        title={
          data &&
          has(data, "title") && (
            <div className="mt-2 w-80 rounded-lg">
              {has(data, "image.url") && (
                <img
                  src={get(data, "image.url", "")}
                  alt={get(data, "image.title", "")}
                  className="object-cover mb-2 w-10 h-10 rounded-full"
                />
              )}
              {has(data, "title") && (
                <h4 className="mb-1 text-sm font-semibold text-white">
                  {get(data, "title", "")}
                </h4>
              )}
              {has(data, "description") && (
                <p className="mb-1 text-xs text-white line-clamp-2">
                  {get(data, "description", "")}
                </p>
              )}
              {has(data, "publisher") && (
                <span className="text-xs text-white">
                  Published by: {get(data, "publisher", "")}
                </span>
              )}
            </div>
          )
        }
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex gap-x-1 items-center"
        >
          {get(data, "title", "") || linkData.title}
          <img
            src={allImgPaths.externalLink}
            alt="external link"
            className="invisible mt-px w-4 h-4 group-hover:visible"
            style={{ verticalAlign: "middle" }}
          />
        </a>
      </Tooltip>
    </div>
  );
};

export interface Chat {
  id: string;
  text: string;
  name: string;
  feedback: string;
  isDocumentExist: number;
  source_documents: Document[];
  upvoted_by: string;
  is_downvote: string;
  isError: boolean;
  created_at: string;
  langsmith_shared_url?: string;
  related_documents?: any[];
}

export interface Document {
  metadata: Metadata;
  url: string;
}

export interface Metadata {
  id: string;
  chunk_index: number;
  document_id: string;
  page: null;
}

/**
 * Renders a chat message with text, sources, and feedback options
 */
const ChatText = ({
  text,
  isSender,
  chat,
  canChat = false,
}: {
  text: string;
  isSender: boolean;
  chat: Chat;
  canChat: boolean;
}) => {
  console.info("chat =>", chat);

  const { setShowDocument, setShowRetrievalDocs, setRetrievalDocs } =
    useAppState(RootState.CHATS);
  const {
    user: { role },
  } = useAppState(RootState.AUTH);

  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { translate } = useTranslate();

  const queryParams = new URLSearchParams(location.search);
  const KEId: string = queryParams.get("KEId") as string;
  const questionId = queryParams.get("questionId") || "";
  const title = queryParams.get("title") || "";

  useEffect(() => {
    if (KEId) {
      setShowDocument(true);
    }
  }, [KEId]);

  const sourceTypes: any[] = useMemo(() => {
    // get documents extension from the chat?.related_documents's file_url
    const fileUrls: string[] = [];

    [
      ...(chat?.source_documents || []),
      ...(chat?.related_documents || []),
    ].forEach((doc: any) => {
      if (doc?.file_url) {
        fileUrls.push(doc?.file_url.split(".").pop());
      } else {
        fileUrls.push("default");
      }
    });

    return uniq(fileUrls) || [];
  }, [chat]);

  const chatText = useMemo(() => text.replace(/\n/g, "<br />"), [text]);

  return (
    <article id={chat.id} key={chat.id}>
      <div
        className={`flex flex-col gap-y-2 gap-x-2 w-full pb-4 pt-3 ${isSender ? "justify-end items-end" : "justify-start items-start"}`}
      >
        <div className="flex gap-x-2">
          {!isSender && (
            <div className="cursor-pointer shrink-0">
              <img
                src={allImgPaths.aiAvatar}
                alt=""
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
          )}
          <div
            className={`group chat-container relative rounded-md px-3 sm:px-4 text-tertiary-900 tracking-wide p-2 ${isSender ? "text-sm currentUserChat max-w-5/6 sm:max-w-full w-fit sm:text-base" : "w-5/6 text-sm aiResponseChat sm:w-full sm:text-base"} group`}
          >
            {!isSender && chat?.langsmith_shared_url && (
              <div
                onClick={() => {
                  window.open(chat.langsmith_shared_url, "_blank");
                }}
                className="absolute top-0 right-2 opacity-0 cursor-pointer md:duration-300 md:group-hover:opacity-100"
              >
                <img
                  src={allImgPaths.langChain}
                  alt="langChain"
                  className="w-12 h-12"
                />
              </div>
            )}
            <div className={`flex gap-x-1 justify-between items-start`}>
              <div
                className={`flex flex-col ${!isSender && chat?.langsmith_shared_url ? "pr-11" : ""}`}
              >
                <Markdown
                  className={`${chat.isError && "text-status-error/70"}`}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    a: CustomAnchor,
                  }}
                >
                  {chatText}
                </Markdown>
              </div>
            </div>

            {chat?.feedback &&
              chat?.is_downvote &&
              ROLES.CHATTER !== role &&
              questionId &&
              title && (
                <div className="flex flex-col flex-wrap p-4 mt-4 bg-white rounded-2xl">
                  <div className="flex gap-x-2 items-center w-full">
                    <div className="w-20">
                      <Divider className="bg-[#C19100] h-0.5" />
                    </div>
                    <div className="flex items-center min-w-[170px] text-sm font-medium gap-x-1 text-secondary-900 justify-normal">
                      <img
                        src={allImgPaths.userIconYellow}
                        alt=""
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <div className=" text-[#C19100] font-semibold">
                        {translate("chats.chatterFeedback")}:
                      </div>
                    </div>
                    <div className="w-full">
                      <Divider className="bg-[#C19100] h-0.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs break-words sm:text-sm text-primary-900">
                      {chat.feedback}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {!isSender && (
          <div className="flex gap-x-1 pl-12 w-full transition-opacity duration-300 justify-left sm:gap-x-2">
            <div className="flex gap-x-1 items-center">
              <CopyButton text={text} />
              {/* {canChat && ( */}
              <>
                {canChat && !chat.upvoted_by && (
                  <UpVote
                    id={chat.id}
                    selected={chat.upvoted_by}
                    canChat={canChat}
                  />
                )}
                {(canChat || chat.is_downvote) && (
                  <DownVote
                    id={chat.id}
                    selected={chat.is_downvote}
                    canChat={canChat}
                  />
                )}
              </>
            </div>
            <div>
              {size(sourceTypes) > 0 && (
                <SourceButton
                  translationKey="common.otherSources"
                  sourceTypes={sourceTypes}
                  onClick={() => {
                    setRetrievalDocs({
                      relatedDocuments: get(chat, "related_documents", []),
                      sourceDocuments: get(chat, "source_documents", []),
                    });
                    setShowRetrievalDocs(true);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default ChatText;
