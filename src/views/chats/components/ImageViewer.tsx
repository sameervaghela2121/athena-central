import allImgPaths from "@/assets";
import { Tooltip } from "@/components";
import { MouseEvent, WheelEvent, useEffect, useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
  fileIcon?: string;
}

/**
 * Component for viewing and manipulating images with zoom, pan, and rotation functionality
 */
const ImageViewer = ({
  imageUrl,
  fileName,
  fileIcon = allImgPaths.file,
}: ImageViewerProps) => {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState<Position>({
    x: 0,
    y: 0,
  });

  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Handles mouse down event to start dragging
   */
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    try {
      if (zoom === 1) return;

      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPosition({ ...position });

      // Change cursor to grabbing
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    } catch (error) {
      console.error("ImageViewer handleMouseDown Error:", error);
    }
  };

  /**
   * Handles mouse movement for panning the image when dragging
   */
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    try {
      if (!isDragging || zoom === 1) return;

      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;

      setPosition({
        x: initialPosition.x + deltaX,
        y: initialPosition.y + deltaY,
      });
    } catch (error) {
      console.error("ImageViewer handleMouseMove Error:", error);
    }
  };

  /**
   * Handles mouse up event to stop dragging
   */
  const handleMouseUp = () => {
    try {
      setIsDragging(false);

      // Change cursor back to grab
      if (containerRef.current) {
        containerRef.current.style.cursor = zoom > 1 ? "grab" : "pointer";
      }
    } catch (error) {
      console.error("ImageViewer handleMouseUp Error:", error);
    }
  };

  /**
   * Handles mouse leave event to stop dragging
   */
  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  /**
   * Handles mouse wheel for zooming in/out
   */
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    try {
      const delta = e.deltaY * -0.01;
      const newZoom = Math.max(1, Math.min(3, zoom + delta));
      // Reset position when zooming out to 1x (original size)
      if (newZoom === 1 && zoom > 1) {
        setPosition({ x: 0, y: 0 });
      }
      setZoom(newZoom);

      // Update cursor based on zoom level
      if (containerRef.current) {
        containerRef.current.style.cursor = newZoom > 1 ? "grab" : "pointer";
      }
    } catch (error) {
      console.error("ImageViewer handleWheel Error:", error);
    }
  };

  /**
   * Handles double click to reset zoom and position
   */
  const handleDoubleClick = () => {
    if (zoom === 1) {
      setPosition({ x: 0, y: 0 });
      setZoom(3);
    } else {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  /**
   * Calculates the shortest rotation path to reach target angle
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
      console.error("ImageViewer calculateShortestRotation Error:", error);
      return 0; // Fallback to 0 in case of error
    }
  };

  /**
   * Resets all image transformations using the shortest path for rotation
   */
  const handleReset = () => {
    try {
      // Reset zoom and position
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      // Calculate and set the rotation to take the shortest path to 0
      const newRotation = calculateShortestRotation(rotation);
      setRotation(newRotation);

      // Reset cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = "pointer";
      }
    } catch (error) {
      console.error("ImageViewer handleReset Error:", error);
    }
  };

  /**
   * Rotates the image by 90 degrees
   */
  const handleRotate = () => {
    try {
      // Rotate 90 degrees clockwise
      setRotation((prev) => prev + 90);
    } catch (error) {
      console.error("ImageViewer handleRotate Error:", error);
    }
  };

  /**
   * Increases zoom level
   */
  const handleZoomIn = () => {
    try {
      const newZoom = Math.min(zoom + 0.2, 3);
      setZoom(newZoom);

      // Update cursor based on zoom level
      if (containerRef.current) {
        containerRef.current.style.cursor = newZoom > 1 ? "grab" : "pointer";
      }
    } catch (error) {
      console.error("ImageViewer handleZoomIn Error:", error);
    }
  };

  /**
   * Decreases zoom level
   */
  const handleZoomOut = () => {
    try {
      const newZoom = Math.max(zoom - 0.2, 1);
      // Reset position when zooming out to 1x (original size)
      if (newZoom === 1 && zoom > 1) {
        setPosition({ x: 0, y: 0 });
      }
      setZoom(newZoom);

      // Update cursor based on zoom level
      if (containerRef.current) {
        containerRef.current.style.cursor = newZoom > 1 ? "grab" : "pointer";
      }
    } catch (error) {
      console.error("ImageViewer handleZoomOut Error:", error);
    }
  };

  /**
   * Toggles fullscreen mode for the image viewer
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
    } catch (error) {
      console.error("ImageViewer handleFullScreen Error:", error);
    }
  };

  /**
   * Effect to update cursor style based on zoom level
   */
  useEffect(() => {
    try {
      if (containerRef.current) {
        containerRef.current.style.cursor =
          zoom > 1 ? (isDragging ? "grabbing" : "grab") : "pointer";
      }
    } catch (error) {
      console.error("ImageViewer cursor effect Error:", error);
    }
  }, [zoom, isDragging]);

  /**
   * Handles keyboard shortcuts for zoom in, zoom out, and reset zoom
   * @param e - Keyboard event
   */
  const handleKeyboardZoom = (e: KeyboardEvent) => {
    try {
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
          console.log("Zoom in shortcut triggered =>", zoom);
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
          console.log("Zoom out shortcut triggered =>", zoom);
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
          handleReset();
          console.log("Zoom reset to default =>", zoom);
        }
      }
    } catch (error) {
      console.error("ImageViewer handleKeyboardZoom Error:", error);
    }
  };

  /**
   * Effect to add keyboard event listeners for zoom shortcuts
   */
  useEffect(() => {
    try {
      // Add keyboard event listener
      document.addEventListener("keydown", handleKeyboardZoom);

      // Cleanup function
      return () => {
        document.removeEventListener("keydown", handleKeyboardZoom);
      };
    } catch (error) {
      console.error("ImageViewer keyboard event listener Error:", error);
    }
  }, [zoom]); // Include zoom in dependencies to ensure we use the latest value

  /**
   * Effect to handle fullscreen change events
   */
  useEffect(() => {
    try {
      // Handle fullscreen change events
      const handleFullscreenChange = () => {
        const isDocumentFullScreen = !!(
          document.fullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        );

        setIsFullScreen(isDocumentFullScreen);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
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
    } catch (error) {
      console.error("ImageViewer fullscreen effect Error:", error);
    }
  }, []);

  return (
    <>
      <div className="flex gap-x-2 px-4 py-1 w-full text-base font-semibold">
        <div className="flex gap-x-1 items-center">
          <img src={fileIcon} className="w-6 h-6" alt="file-icon" />
          <span>{fileName || ""}</span>
        </div>
      </div>

      <div
        className="flex flex-col gap-y-3 justify-center p-5 w-full"
        ref={containerRef}
      >
        <div
          className="flex overflow-hidden relative flex-col justify-center items-center w-full h-[calc(100vh-300px)] max-h-[900px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={imageUrl}
            className="object-contain w-full max-w-full max-h-full rounded-lg"
            style={{
              transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            alt={fileName}
          />
        </div>
        <div className="flex sticky bottom-0 justify-center w-full">
          <div className="flex z-10 gap-2 justify-center px-4 py-2 mb-4 rounded-full shadow-md backdrop-blur-sm w-fit bg-white/90">
            <Tooltip place="top" title="Zoom Out">
              <button
                onClick={handleZoomOut}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageViewer;
