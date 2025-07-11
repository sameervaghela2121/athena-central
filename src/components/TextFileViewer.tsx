import allImgPaths from "@/assets";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import LoaderCircle from "./LoaderCircle";

interface TextFileViewerProps {
  fileUrl: string;
  className?: string;
  fileName?: string;
}

/**
 * Component for viewing text files with markdown rendering support
 */
const TextFileViewer: React.FC<TextFileViewerProps> = ({
  fileUrl,
  className = "",
  fileName,
}) => {
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTextFile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fileUrl);

        if (!response.ok) throw new Error("Failed to fetch file");
        const textData = await response.text();
        setText(textData);
      } catch (err) {
        console.error("fetchTextFile Error:", err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTextFile();
  }, [fileUrl]);

  return (
    <div className={`${className}`}>
      <div className="flex gap-x-2 px-4 py-1 w-full text-base font-semibold">
        <img src={allImgPaths.txt} />
        <span>{fileName || ""}</span>
      </div>
      <div className="overflow-auto px-4 mt-4 h-[calc(100vh_-_270px)]">
        {isLoading ? (
          <LoaderCircle className="mx-auto" />
        ) : error ? (
          <p className="text-status-error">Error: {error}</p>
        ) : (
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {text}
          </Markdown>
        )}
      </div>
    </div>
  );
};

export default TextFileViewer;
