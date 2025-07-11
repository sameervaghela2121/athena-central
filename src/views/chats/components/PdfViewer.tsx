import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import allImgPaths from "@/assets";
import { Tooltip } from "@/components";
import { useTranslate } from "@/hooks";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * PDF Viewer component with zoom functionality
 * Displays PDF documents with zoom in/out controls
 */
const PdfViewer = ({
  url,
  fileName,
  pageNumber,
  onDocumentLoadSuccess,
  onDocumentLoadFailure,
  handlePageChange,
  currentPage,
  numPages,
}: any) => {
  const { translate } = useTranslate();
  const [dimensions, setDimensions] = useState({ width: 591, height: 650 });
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // PDF scale state for zoom functionality
  const [scale, setScale] = useState(1);
  const MIN_SCALE = 1;
  const MAX_SCALE = 2.5;
  const SCALE_STEP = 0.25;

  // PDF position state for drag functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Rotation state
  const [rotation, setRotation] = useState(0);

  const [file, setFile] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Downloads the PDF file and tracks progress
   */
  const downloadFile = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const response = await fetch(url);
      const contentLength = response.headers.get("content-length");
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedLength += value.length;
          setDownloadProgress(Math.round((receivedLength / totalSize) * 100));
        }
      }

      const blob = new Blob(chunks);
      const blobUrl = window.URL.createObjectURL(blob);

      setFile(blobUrl);
      // const anchor = document.createElement("a");
      // anchor.href = blobUrl;
      // anchor.download = "document.pdf"; // Change filename as needed
      // anchor.click();

      // window.URL.revokeObjectURL(blobUrl);
      setIsDownloading(false);
    } catch (error) {
      console.error("PdfViewer.downloadFile Error:", error);
      setIsDownloading(false);
    }
  };

  /**
   * Handles zoom in button click
   */
  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + SCALE_STEP, MAX_SCALE));
  };

  /**
   * Handles zoom out button click
   */
  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - SCALE_STEP, MIN_SCALE));
  };

  /**
   * Calculates the shortest rotation path between current and target rotation
   * @param currentRotation - Current rotation value in degrees
   * @param targetRotation - Target rotation value in degrees (default: 0)
   * @returns The new rotation value that represents the shortest path
   */
  const calculateShortestRotation = (
    currentRotation: number,
    targetRotation: number = 0,
  ) => {
    try {
      // Normalize both rotations to 0-360 range
      const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
      const normalizedTarget = ((targetRotation % 360) + 360) % 360;

      // Calculate both possible directions
      const clockwise = (normalizedTarget - normalizedCurrent + 360) % 360;
      const counterClockwise =
        (normalizedCurrent - normalizedTarget + 360) % 360;

      // Choose the shorter path
      if (clockwise <= counterClockwise) {
        // Go clockwise
        return currentRotation + clockwise;
      } else {
        // Go counterclockwise
        return currentRotation - counterClockwise;
      }
    } catch (error) {
      console.error("PdfViewer calculateShortestRotation Error:", error);
      return 0; // Fallback to 0 in case of error
    }
  };

  /**
   * Handles rotation button click
   */
  const handleRotate = () => {
    try {
      // Rotate 90 degrees clockwise
      setRotation((prevRotation) => (prevRotation + 90) % 360);
    } catch (error) {
      console.error("PdfViewer handleRotate Error:", error);
    }
  };

  /**
   * Resets all transformations (zoom, position, rotation)
   */
  const handleReset = () => {
    try {
      // Reset zoom and position
      setScale(1);
      setPosition({ x: 0, y: 0 });

      // Calculate and set the rotation to take the shortest path to 0
      const newRotation = calculateShortestRotation(rotation);
      setRotation(newRotation);

      // Reset cursor if needed
      if (pageRef.current) {
        pageRef.current.style.cursor = "default";
      }
    } catch (error) {
      console.error("PdfViewer handleReset Error:", error);
    }
  };

  /**
   * Handles full screen toggle for the PDF viewer
   * Uses browser's Fullscreen API to expand/collapse the viewer
   */
  const handleFullScreen = () => {
    try {
      if (!containerRef.current) return;

      if (!isFullScreen) {
        // Enter fullscreen mode
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          /* Firefox */
          (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          /* Chrome, Safari & Opera */
          (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          /* IE/Edge */
          (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen mode
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          /* Firefox */
          (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
          /* Chrome, Safari & Opera */
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          /* IE/Edge */
          (document as any).msExitFullscreen();
        }
      }

      // Update dimensions after fullscreen change
      setTimeout(updateDimensions, 300);
    } catch (error) {
      console.error("PdfViewer.handleFullScreen Error:", error);
    }
  };

  /**
   * Updates dimensions based on container size
   */
  const updateDimensions = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40; // Subtract padding
      const containerHeight = containerRef.current.clientHeight - 60; // Subtract header height

      // Use a fixed aspect ratio to maintain PDF proportions
      const aspectRatio = 0.707; // Standard PDF aspect ratio (A4)

      let width, height;

      // Calculate dimensions that fit within the container while maintaining aspect ratio
      if (containerWidth / aspectRatio <= containerHeight) {
        // Width constrained
        width = containerWidth;
        height = containerWidth / aspectRatio;
      } else {
        // Height constrained
        height = containerHeight;
        width = height * aspectRatio;
      }

      // Ensure minimum dimensions
      width = Math.max(width, 100);
      height = Math.max(height, 100);

      setDimensions({ width, height });
    }
  };

  /**
   * Calculates the boundaries for dragging based on current scale and dimensions
   * @returns Maximum drag boundaries in each direction
   */
  const calculateDragBoundaries = () => {
    if (!containerRef.current)
      return { maxLeft: 0, maxRight: 0, maxTop: 0, maxBottom: 0 };

    // Calculate how much the content has grown due to scaling
    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;

    // Calculate the overflow amount (how much larger the scaled content is compared to container)
    const overflowX = Math.max(0, scaledWidth - dimensions.width);
    const overflowY = Math.max(0, scaledHeight - dimensions.height);

    // Calculate maximum drag distances in each direction
    return {
      maxLeft: -overflowX / 2, // Allow dragging left half the overflow
      maxRight: overflowX / 2, // Allow dragging right half the overflow
      maxTop: -overflowY / 2, // Allow dragging up half the overflow
      maxBottom: overflowY / 2, // Allow dragging down half the overflow
    };
  };

  /**
   * Constrains the position within the calculated boundaries
   * @param pos Current position
   * @returns Constrained position
   */
  const constrainPosition = (pos: { x: number; y: number }) => {
    const { maxLeft, maxRight, maxTop, maxBottom } = calculateDragBoundaries();

    return {
      x: Math.min(Math.max(pos.x, maxLeft), maxRight),
      y: Math.min(Math.max(pos.y, maxTop), maxBottom),
    };
  };

  /**
   * Handles mouse down event to start dragging
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    try {
      if (scale <= 1) return; // Only allow dragging when zoomed in
      e.preventDefault(); // Prevent text selection during drag

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });

      // Change cursor to grabbing
      if (pageRef.current) {
        pageRef.current.style.cursor = "grabbing";
      }
    } catch (error) {
      console.error("PdfViewer handleMouseDown Error:", error);
    }
  };

  /**
   * Handles mouse move event to update position while dragging
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    try {
      if (!isDragging) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      const newPosition = {
        x: position.x + dx,
        y: position.y + dy,
      };

      // Apply constraints to keep content within viewable area
      const constrainedPosition = constrainPosition(newPosition);
      setPosition(constrainedPosition);

      setDragStart({ x: e.clientX, y: e.clientY });
    } catch (error) {
      console.error("PdfViewer handleMouseMove Error:", error);
    }
  };

  /**
   * Handles mouse up event to stop dragging
   */
  const handleMouseUp = () => {
    try {
      setIsDragging(false);

      // Change cursor back to pointer
      if (pageRef.current) {
        pageRef.current.style.cursor = scale > 1 ? "grab" : "default";
      }
    } catch (error) {
      console.error("PdfViewer handleMouseUp Error:", error);
    }
  };

  /**
   * Handles touch start event for mobile drag support
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    try {
      if (scale <= 1) return; // Only allow dragging when zoomed in

      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });

      // Change cursor for visual feedback (though not visible on touch devices)
      if (pageRef.current) {
        pageRef.current.style.cursor = "grabbing";
      }
    } catch (error) {
      console.error("PdfViewer handleTouchStart Error:", error);
    }
  };

  /**
   * Handles touch move event for mobile drag support
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    try {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging

      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;

      const newPosition = {
        x: position.x + dx,
        y: position.y + dy,
      };

      // Apply constraints to keep content within viewable area
      const constrainedPosition = constrainPosition(newPosition);
      setPosition(constrainedPosition);

      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    } catch (error) {
      console.error("PdfViewer handleTouchMove Error:", error);
    }
  };

  /**
   * Handles touch end event for mobile drag support
   */
  const handleTouchEnd = () => {
    try {
      setIsDragging(false);

      // Reset cursor style
      if (pageRef.current) {
        pageRef.current.style.cursor = scale > 1 ? "grab" : "default";
      }
    } catch (error) {
      console.error("PdfViewer handleTouchEnd Error:", error);
    }
  };

  /**
   * Handles resetting zoom to default scale
   */
  const handleResetZoom = () => {
    try {
      setScale(MIN_SCALE);
      // Reset position when zoom is reset
      setPosition({ x: 0, y: 0 });
      console.log("Zoom reset to default =>", MIN_SCALE);
    } catch (error) {
      console.error("PdfViewer handleResetZoom Error:", error);
    }
  };

  /**
   * Handles keyboard shortcuts for zoom in, zoom out, and reset zoom
   * @param e - Keyboard event
   */
  const handleKeyboardZoom = (e: KeyboardEvent) => {
    try {
      // Debug keyboard events to identify the correct key codes
      console.log("Key event:", {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      });

      // Check for Ctrl/Cmd key combinations
      if (e.ctrlKey || e.metaKey) {
        // Handle zoom in: Ctrl/Cmd + '+' or Ctrl/Cmd + '='
        if (
          e.key === "+" ||
          e.key === "=" ||
          e.key === "Equal" ||
          e.code === "Equal" ||
          e.code === "NumpadAdd" ||
          e.keyCode === 187 ||
          e.which === 187 ||
          e.keyCode === 107 ||
          e.which === 107
        ) {
          e.preventDefault();
          handleZoomIn();
          console.log("Zoom in shortcut triggered =>", scale);
        }
        // Handle zoom out: Ctrl/Cmd + '-'
        else if (
          e.key === "-" ||
          e.key === "Minus" ||
          e.key === "_" ||
          e.code === "Minus" ||
          e.code === "NumpadSubtract" ||
          e.keyCode === 189 ||
          e.which === 189 ||
          e.keyCode === 173 ||
          e.which === 173 ||
          e.keyCode === 109 ||
          e.which === 109
        ) {
          e.preventDefault();
          handleZoomOut();
          console.log("Zoom out shortcut triggered =>", scale);
        }
        // Handle reset zoom: Ctrl/Cmd + '0'
        else if (
          e.key === "0" ||
          e.keyCode === 48 ||
          e.which === 48 ||
          e.key === "NumPad0" ||
          e.keyCode === 96 ||
          e.which === 96
        ) {
          e.preventDefault();
          handleResetZoom();
        }
      }
    } catch (error) {
      console.error("PdfViewer handleKeyboardZoom Error:", error);
    }
  };

  // Debounced version of updateDimensions to avoid excessive updates
  const debouncedUpdateDimensions = debounce(updateDimensions, 200);

  useEffect(() => {
    downloadFile();

    // Initial dimensions update
    setTimeout(updateDimensions, 100); // Small delay to ensure container is rendered

    // Update dimensions on resize
    window.addEventListener("resize", debouncedUpdateDimensions);

    // Add global mouse/touch event listeners for drag end outside component
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);

    // Add keyboard event listener for zoom shortcuts
    document.addEventListener("keydown", handleKeyboardZoom);

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      const isDocumentFullScreen = !!(
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullScreen(isDocumentFullScreen);
      // Update dimensions after fullscreen change
      setTimeout(updateDimensions, 300);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("resize", debouncedUpdateDimensions);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyboardZoom);

      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  interface PdfLoaderProps {
    progress: number;
    fileName?: string;
    icon?: string;
  }

  const PdfLoader: React.FC<PdfLoaderProps> = ({
    progress,
    fileName,
    icon,
  }) => {
    return (
      <div className="flex flex-col justify-center items-center p-8 mx-auto w-full min-h-[734px] bg-white rounded-lg">
        <div className="flex gap-x-2 px-4 py-1 w-full text-base font-semibold">
          <img
            src={icon || allImgPaths.pdfIcon}
            className="w-6 h-6"
            alt="file-icon"
          />
          <span>{fileName || ""}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className="bg-secondary-900 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-sm font-medium text-gray-600">
          Loading... {Math.round(progress)}%
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex gap-x-2 px-4 py-1 w-full text-base font-semibold">
        <img src={allImgPaths.pdf} className="w-6 h-6" />
        <span>{fileName || ""}</span>
      </div>

      <div
        ref={containerRef}
        className="flex overflow-hidden relative flex-col gap-y-3 justify-center items-center mx-auto w-full h-[calc(100vh_-_295px)]"
      >
        <div className="flex overflow-hidden relative justify-center items-center p-4 w-full h-full">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            renderMode="canvas"
            loading={
              <PdfLoader progress={downloadProgress} fileName={fileName} />
            }
            onLoadError={onDocumentLoadFailure}
            onSourceError={onDocumentLoadFailure}
            noData={
              <PdfLoader progress={downloadProgress} fileName={fileName} />
            }
            className="overflow-hidden w-full h-full"
          >
            <div
              ref={pageRef}
              className={`relative ${scale > 1 ? "cursor-move" : ""}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => isDragging && setIsDragging(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={() => setIsDragging(false)}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
                transformOrigin: "center",
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                willChange: "transform",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Page
                className="shadow-md border rounded-md !sm:p-8 justify-center items-center flex"
                width={dimensions.width}
                height={dimensions.height}
                pageNumber={pageNumber || 1}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          </Document>
        </div>
        {downloadProgress >= 100 && (
          <div className="flex sticky top-0 z-10 gap-2 justify-center px-4 py-2 mb-4 rounded-full shadow-md backdrop-blur-sm bg-white/90">
            <Tooltip place="top" title="Zoom Out">
              <button
                onClick={handleZoomOut}
                disabled={scale <= MIN_SCALE}
                className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src={allImgPaths.zoomOut}
                  alt="Zoom Out"
                  className="w-5 h-5"
                />
              </button>
            </Tooltip>
            <Tooltip place="top" title="Zoom In">
              <button
                onClick={handleZoomIn}
                disabled={scale >= MAX_SCALE}
                className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src={allImgPaths.zoomIn}
                  alt="Zoom In"
                  className="w-5 h-5"
                />
              </button>
            </Tooltip>
            <Tooltip place="top" title="Rotate">
              <button
                onClick={handleRotate}
                className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <img
                  src={allImgPaths.rotate}
                  alt="Rotate"
                  className="w-5 h-5"
                />
              </button>
            </Tooltip>
            <Tooltip place="top" title="Reset">
              <button
                onClick={handleReset}
                className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <img
                  src={allImgPaths.refresh}
                  alt="Reset"
                  className="w-5 h-5"
                />
              </button>
            </Tooltip>
            <Tooltip
              place="top"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <button
                onClick={handleFullScreen}
                className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <img
                  src={allImgPaths.fullscreenDarkIcon}
                  alt={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="w-5 h-5"
                />
              </button>
            </Tooltip>
            {isFullScreen && (
              <>
                {/* next and previous page change */}
                <Tooltip place="top" title="Previous Page">
                  <button
                    onClick={() => handlePageChange("prev")}
                    className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    <img
                      src={allImgPaths.pagiLeftArrow}
                      alt="Previous Page"
                      className="w-5 h-5"
                    />
                  </button>
                </Tooltip>
                <div className="flex gap-x-2 items-center">
                  <div>{translate("common.page")}</div>
                  <div>{currentPage}</div>
                  <div>
                    {translate("common.of")} {numPages}
                  </div>
                </div>
                <Tooltip place="top" title="Next Page">
                  <button
                    onClick={() => handlePageChange("next")}
                    className="flex justify-center items-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    <img
                      src={allImgPaths.pagiRightArrow}
                      alt="Next Page"
                      className="w-5 h-5"
                    />
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PdfViewer;
