import keAPI from "@/apis/KE";
import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";
import { motion } from "framer-motion";
import { debounce, size } from "lodash-es";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Highlighter from "react-highlight-words";
import ButtonV2 from "./ButtonV2";
import Switch from "./Switch";
import Tooltip from "./Tooltip";

/**
 * Interface representing a time range for highlighting segments in the video
 */
interface TimeRange {
  start: number;
  end: number;
}

/**
 * Interface for transcript item with formatted timestamps
 */
interface FormattedTranscriptItem {
  start_time: string;
  end_time: string;
  text: string;
  startTime: string;
  endTime: string;
}

/**
 * Props for the VideoPlayer component
 */
interface VideoPlayerProps {
  /**
   * Start time from where the video should start
   */
  initStartFrom?: number;
  /**
   * URL of the video to be played
   */
  src: string;
  /**
   * Optional array of time ranges to highlight in the progress bar
   */
  highlightSegments?: TimeRange[];
  /**
   * Optional CSS class names to apply to the video container
   */
  className?: string;
  /**
   * Optional callback when video playback ends
   */
  onEnded?: () => void;
  /**
   * Optional initial volume (0-1)
   */
  initialVolume?: number;
  /**
   * Optional flag to autoplay the video
   */
  autoPlay?: boolean;
  /**
   * Optional array of segments to highlight in the progress bar
   */
  transcription?: {
    end_time: string; // eg. 00:00:11
    start_time: string; // eg.00:00:11
    text: string;
  }[];
  /**
   * Optional callback to set show transcript state
   */
  setShowTranscript?: (showTranscript: boolean) => void;
  /**
   * Optional file name to display in the header
   */
  fileName?: string;
  /**
   * Optional flag to show the header with file name and download button
   */
  showHeader?: boolean;
  /**
   * Optional id of the document
   */
  id?: string;
}

/**
 * A reusable video player component with custom controls
 * Features include custom progress bar with segment highlighting and volume control
 */
const VideoPlayer = ({
  src,
  initStartFrom = 0,
  highlightSegments = [],
  className = "",
  onEnded,
  initialVolume = 0.7,
  autoPlay = false,
  transcription,
  setShowTranscript: setShowTranscriptState,
  fileName = "",
  showHeader = true,
  id = "",
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initStartFrom);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [videoHeight, setVideoHeight] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const scrollTimeoutRef = useRef<number | null>(null);

  const { translate } = useTranslate();

  /**
   * Format seconds into MM:SS format
   */
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return "00:00";

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Convert timestamp string (HH:MM:SS) to seconds
   */
  const timeToSeconds = (timeString: string): number => {
    try {
      const parts = timeString.split(":").map(Number);
      if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        // MM:SS format
        return parts[0] * 60 + parts[1];
      }
      return 0;
    } catch (error) {
      console.error("timeToSeconds Error:", error);
      return 0;
    }
  };

  /**
   * Toggle transcript visibility
   */
  const toggleTranscript = useCallback(() => {
    try {
      setShowTranscript((prev) => !prev);
    } catch (error) {
      console.error("toggleTranscript Error:", error);
    }
  }, []);

  useEffect(() => {
    setShowTranscriptState?.(showTranscript);
  }, [showTranscript]);

  /**
   * Toggle play/pause state of the video
   */
  const togglePlay = useCallback(() => {
    try {
      if (!videoRef.current) return;

      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }

      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("togglePlay Error:", error);
    }
  }, [isPlaying]);

  /**
   * Handle click on the progress bar to seek to a specific position
   */
  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      try {
        if (!videoRef.current || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const seekTime = clickPosition * duration;

        videoRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      } catch (error) {
        console.error("handleProgressBarClick Error:", error);
      }
    },
    [duration],
  );

  /**
   * Handle mouse down on the progress bar to start dragging
   */
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  /**
   * Handle mouse move while dragging the progress bar
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      try {
        if (!isDragging || !videoRef.current || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPosition = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        const seekTime = clickPosition * duration;

        videoRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      } catch (error) {
        console.error("handleMouseMove Error:", error);
      }
    },
    [isDragging, duration],
  );

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Toggle mute state of the video
   */
  const toggleMute = useCallback(() => {
    try {
      if (!videoRef.current) return;

      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("toggleMute Error:", error);
    }
  }, [isMuted]);

  /**
   * Handle volume change
   */
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        if (!videoRef.current) return;

        const newVolume = parseFloat(e.target.value);
        videoRef.current.volume = newVolume;
        setVolume(newVolume);

        if (newVolume === 0) {
          setIsMuted(true);
          videoRef.current.muted = true;
        } else if (isMuted) {
          setIsMuted(false);
          videoRef.current.muted = false;
        }
      } catch (error) {
        console.error("handleVolumeChange Error:", error);
      }
    },
    [isMuted],
  );

  /**
   * Toggle fullscreen mode
   */
  const toggleFullScreen = useCallback(() => {
    try {
      if (!videoRef.current) return;

      if (!document.fullscreenElement) {
        videoRef.current
          .requestFullscreen()
          .then(() => {
            setIsFullScreen(true);
          })
          .catch((err) => {
            console.error("toggleFullScreen Error:", err);
          });
      } else {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullScreen(false);
          })
          .catch((err) => {
            console.error("toggleFullScreen Error:", err);
          });
      }
    } catch (error) {
      console.error("toggleFullScreen Error:", error);
    }
  }, []);

  /**
   * Handle time update event from the video element
   */
  const handleTimeUpdate = useCallback(() => {
    try {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    } catch (error) {
      console.error("handleTimeUpdate Error:", error);
    }
  }, []);

  /**
   * Handle loaded metadata event to set video duration
   */
  const handleLoadedMetadata = useCallback(() => {
    try {
      if (!videoRef.current) return;

      setDuration(videoRef.current.duration);
      // Set initial time if specified
      if (initStartFrom > 0) {
        videoRef.current.currentTime = initStartFrom;
        setCurrentTime(initStartFrom);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("handleLoadedMetadata Error:", error);
    }
  }, [initStartFrom]);

  /**
   * Handle video end event
   */
  const handleVideoEnded = useCallback(() => {
    try {
      setIsPlaying(false);
      if (onEnded) onEnded();
    } catch (error) {
      console.error("handleVideoEnded Error:", error);
    }
  }, [onEnded]);

  /**
   * Debounced function to hide controls after inactivity
   */
  const hideControls = useCallback(
    debounce(() => {
      if (!isPlaying) return;
      setShowControls(false);
    }, 3000),
    [isPlaying],
  );

  /**
   * Show controls on mouse move
   */
  const handleMouseMovement = useCallback(() => {
    setShowControls(true);
    hideControls();
  }, [hideControls]);

  // Add event listeners for mouse movement and dragging
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMovement);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMovement);

      if (isDragging) {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }

      hideControls.cancel();
    };
  }, [
    handleMouseMovement,
    hideControls,
    isDragging,
    handleMouseMove,
    handleMouseUp,
  ]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        if (!videoRef.current) return;

        // Skip keyboard shortcuts if focus is on an input element (like search input)
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA");

        if (isInputFocused) return;

        switch (e.key.toLowerCase()) {
          case " ":
          case "k":
            e.preventDefault();
            togglePlay();
            break;
          case "m":
            e.preventDefault();
            toggleMute();
            break;
          case "f":
            e.preventDefault();
            toggleFullScreen();
            break;
          case "t":
            e.preventDefault();
            toggleTranscript();
            break;
          case "arrowright":
            e.preventDefault();
            videoRef.current.currentTime = Math.min(
              videoRef.current.duration,
              videoRef.current.currentTime + 5,
            );
            break;
          case "arrowleft":
            e.preventDefault();
            videoRef.current.currentTime = Math.max(
              0,
              videoRef.current.currentTime - 5,
            );
            break;
          case "arrowup":
            e.preventDefault();
            const newVolUp = Math.min(1, volume + 0.1);
            videoRef.current.volume = newVolUp;
            setVolume(newVolUp);
            if (isMuted) {
              videoRef.current.muted = false;
              setIsMuted(false);
            }
            break;
          case "arrowdown":
            e.preventDefault();
            const newVolDown = Math.max(0, volume - 0.1);
            videoRef.current.volume = newVolDown;
            setVolume(newVolDown);
            if (newVolDown === 0) {
              videoRef.current.muted = true;
              setIsMuted(true);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("handleKeyDown Error:", error);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    togglePlay,
    toggleMute,
    toggleFullScreen,
    toggleTranscript,
    volume,
    isMuted,
  ]);

  // Set initial volume and autoplay if needed
  useEffect(() => {
    try {
      if (!videoRef.current) return;

      videoRef.current.volume = volume;

      if (autoPlay) {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Autoplay Error:", error);
          });
      }
    } catch (error) {
      console.error("Initial setup Error:", error);
    }
  }, [volume, autoPlay]);

  // Reset loading state when src changes
  useEffect(() => {
    try {
      setIsLoading(true);
    } catch (error) {
      console.error("Video src change Error:", error);
    }
  }, [src]);

  /**
   * Update video height when video dimensions change
   */
  useEffect(() => {
    try {
      if (!videoRef.current) return;

      // Create ResizeObserver to track video element size changes
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === videoRef.current) {
            setVideoHeight(entry.target.clientHeight);
          }
        }
      });

      // Start observing the video element
      resizeObserver.observe(videoRef.current);

      // Initial height measurement
      setVideoHeight(videoRef.current.clientHeight);

      // Cleanup observer on component unmount
      return () => {
        resizeObserver.disconnect();
      };
    } catch (error) {
      console.error("videoHeightObserver Error:", error);
    }
  }, []);

  /**
   * Handle user scroll in transcript container and temporarily disable auto-scrolling
   */
  const handleUserScroll = useCallback(() => {
    try {
      // Set user scrolling flag to true
      setIsUserScrolling(true);

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      // Reset the flag after 2 seconds of inactivity
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 5000);
    } catch (error) {
      console.error("handleUserScroll Error:", error);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to current transcript item
  useEffect(() => {
    try {
      // Skip auto-scroll if user is manually scrolling or if transcript is not visible
      if (
        !showTranscript ||
        !transcriptRef.current ||
        !transcription?.length ||
        isUserScrolling ||
        !isPlaying
      )
        return;

      const activeTranscriptItem = document.querySelector(
        ".transcript-item-active",
      );
      const transcriptContainer = document.querySelector(
        ".transcript-container",
      );

      if (activeTranscriptItem && transcriptContainer) {
        // Get the positions and dimensions
        const containerRect = transcriptContainer.getBoundingClientRect();
        const activeItemRect = activeTranscriptItem.getBoundingClientRect();

        // Calculate if the active item is outside the visible area
        const isItemAbove = activeItemRect.top < containerRect.top + 10; // Adding small buffer
        const isItemBelow = activeItemRect.bottom > containerRect.bottom - 10; // Adding small buffer

        if (isItemAbove || isItemBelow) {
          // Calculate scroll position to show the active item without hiding the header
          // Use 'nearest' to minimize scrolling and prevent the header from being hidden
          activeTranscriptItem.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    } catch (error) {
      console.error("Transcript scroll Error:", error);
    }
  }, [currentTime, showTranscript, transcription, isUserScrolling]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = initStartFrom;
    setCurrentTime(initStartFrom);
  }, [initStartFrom]);

  /**
   * Process transcription data to format timestamps
   */
  const _transcription = useMemo<FormattedTranscriptItem[] | undefined>(() => {
    try {
      // remove the hour from start and end time if video length is less than or equal to 1 hour
      return transcription?.map((item) => {
        const startTime = item.start_time.split(":");
        const endTime = item.end_time.split(":");
        return {
          ...item,
          startTime: `${startTime[1]}:${startTime[2]}`,
          endTime: `${endTime[1]}:${endTime[2]}`,
        };
      });
    } catch (error) {
      console.error("_transcription Error:", error);
      return undefined;
    }
  }, [transcription]);

  /**
   * Filter transcript based on search query
   */
  const filteredTranscript = useMemo<FormattedTranscriptItem[]>(() => {
    try {
      if (!searchQuery || !_transcription) return _transcription || [];

      const query = searchQuery.toLowerCase();
      return _transcription.filter((item) =>
        item.text.toLowerCase().includes(query),
      );
    } catch (error) {
      console.error("filteredTranscript Error:", error);
      return _transcription || [];
    }
  }, [_transcription, searchQuery]);

  /**
   * Handles downloading the transcription as JSON
   */
  const handleDownloadTranscription = async () => {
    try {
      await keAPI.downloadTranscript(id);
    } catch (error) {
      console.error("VideoPlayer handleDownloadTranscription Error:", error);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {showHeader && (
        <div className="flex gap-x-2 justify-between items-start px-4 py-1 w-full font-semibold">
          <div className="flex overflow-hidden gap-x-1 items-center">
            <img
              src={allImgPaths.videoIcon}
              alt="video-icon"
              className="flex-shrink-0"
            />
            <span className="text-xs truncate sm:text-sm md:text-base">
              {fileName || ""}
            </span>
          </div>
          <div>
            {transcription && transcription.length > 0 && (
              <ButtonV2
                variant="secondary"
                className="!py-1 !px-4"
                onClick={toggleTranscript}
              >
                <div className="flex gap-x-1 items-center">
                  {/* <img
                    src={allImgPaths.transcriptIcon}
                    alt="transcript"
                    className="w-4 h-4"
                  /> */}
                  <span className="hidden sm:block">
                    {translate(
                      showTranscript
                        ? "common.hideTranscript"
                        : "common.showTranscript",
                    )}
                  </span>
                  <span className="block sm:hidden">
                    {translate(showTranscript ? "common.hide" : "common.show")}
                  </span>
                </div>
              </ButtonV2>
            )}
          </div>
        </div>
      )}
      <div
        className={`overflow-hidden relative p-4 rounded-lg`}
        onMouseMove={handleMouseMovement}
      >
        <div className="flex flex-col gap-x-1 gap-y-4 w-full h-full transition-all duration-300 ease-in-out lg:flex-row">
          <div
            ref={videoContainerRef}
            className={`bg-black ${showTranscript ? "lg:w-auto" : "w-full"} w-full h-full rounded-lg transition-all duration-300 ease-in-out relative flex items-center justify-center overflow-hidden`}
          >
            {/* Blurred background video */}
            <div className="hidden overflow-hidden absolute inset-0 z-0">
              <video
                src={src}
                className="object-cover w-full h-full scale-110"
                style={{ filter: "blur(50px) brightness(0.5)" }}
                muted
                playsInline
                ref={(el) => {
                  if (el && videoRef.current) {
                    // Keep background video in sync with main video
                    el.currentTime = videoRef.current.currentTime;
                    if (videoRef.current.paused) {
                      el.pause();
                    } else {
                      el.play().catch(() => {
                        // Ignore autoplay errors
                      });
                    }
                  }
                }}
              />
            </div>
            {isLoading && (
              <div className="flex absolute inset-0 z-20 justify-center items-center rounded-lg bg-black/50">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-4 animate-spin border-tertiary-600 border-t-tertiary-900"></div>
                  <p className="mt-3 text-sm text-white">
                    {translate("common.loading")}
                  </p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={src}
              className="object-contain relative z-10 w-full h-full max-h-full rounded-lg"
              onTimeUpdate={() => {
                handleTimeUpdate();
                // Sync background video with main video
                if (videoRef.current) {
                  const bgVideo = videoRef.current.parentElement?.querySelector(
                    "div > video",
                  ) as HTMLVideoElement | null;
                  if (
                    bgVideo &&
                    Math.abs(
                      bgVideo.currentTime - videoRef.current.currentTime,
                    ) > 0.5
                  ) {
                    bgVideo.currentTime = videoRef.current.currentTime;
                  }
                }
              }}
              onLoadedMetadata={handleLoadedMetadata}
              onError={() => {
                console.error("VideoPlayer Error: Failed to load video");
                setIsLoading(false);
              }}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
              onPlay={() => {
                // Sync play state with background video
                const bgVideo = videoRef.current?.parentElement?.querySelector(
                  "div > video",
                ) as HTMLVideoElement;
                if (bgVideo)
                  bgVideo.play().catch(() => {
                    /* Ignore autoplay errors */
                  });
              }}
              onPause={() => {
                // Sync pause state with background video
                const bgVideo = videoRef.current?.parentElement?.querySelector(
                  "div > video",
                ) as HTMLVideoElement;
                if (bgVideo) bgVideo.pause();
              }}
              playsInline
            />
            {/* Play button - positioned relative to video element */}
            {!isPlaying && !isLoading && (
              <div
                className="flex absolute top-1/2 left-1/2 z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="flex justify-center items-center w-12 h-12 r`ounded-full shadow-lg backdrop-blur-sm sm:w-16 sm:h-16 bg-black/40">
                  <img
                    src={allImgPaths.playIcon}
                    alt="play"
                    className="w-6 h-6 sm:w-8 sm:h-8"
                  />
                </div>
              </div>
            )}

            {/* Custom controls overlay */}
            <div
              className={`bg-black/25 z-20 backdrop-blur-sm rounded-lg py-2 sm:py-4 shadow-md px-2 sm:px-4 md:px-7 mx-2 sm:mx-5 md:mx-9 absolute bottom-2 sm:bottom-4 md:bottom-6 left-0 right-0 transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              } animate-fade animate-duration-300`}
            >
              {/* Progress bar with highlighted segments */}
              <div
                ref={progressBarRef}
                className="relative mb-2 w-full h-1.5 sm:h-2 rounded-full cursor-pointer bg-tertiary-600"
                onClick={handleProgressBarClick}
                onMouseDown={handleMouseDown}
              >
                {/* Played progress */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-tertiary-900"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />

                {/* Highlighted segments */}
                {highlightSegments.map((segment, index) => (
                  <div
                    key={index}
                    className="absolute top-0 h-full bg-red-500 rounded-full opacity-70"
                    style={{
                      left: `${(segment.start / duration) * 100}%`,
                      width: `${((segment.end - segment.start) / duration) * 100}%`,
                    }}
                  />
                ))}

                {/* Progress handle */}
                <div
                  className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 sm:w-4 sm:h-4"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Controls row */}
              <div className="flex justify-between items-center rounded-lg">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Play/Pause button */}
                  <button onClick={togglePlay} className="p-1 rounded-full">
                    {isPlaying ? (
                      <img
                        src={allImgPaths.pauseIcon}
                        alt="pause"
                        className="w-4 h-4 sm:w-auto sm:h-auto"
                      />
                    ) : (
                      <img
                        src={allImgPaths.playIcon}
                        alt="play"
                        className="w-4 h-4 sm:w-auto sm:h-auto"
                      />
                    )}
                  </button>

                  {/* Time display */}
                  <div className="text-xs text-white sm:text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Volume control - hidden on small screens */}
                  <div className="hidden items-center sm:flex group">
                    <button onClick={toggleMute} className="p-1 rounded-full">
                      {isMuted || volume === 0 ? (
                        <img
                          src={allImgPaths.muteIcon}
                          alt="mute"
                          className="w-4 h-4 sm:w-auto sm:h-auto"
                        />
                      ) : volume < 0.5 ? (
                        <img
                          src={allImgPaths.unmuteIcon}
                          alt="unmute"
                          className="w-4 h-4 sm:w-auto sm:h-auto"
                        />
                      ) : (
                        <img
                          src={allImgPaths.unmuteIcon}
                          alt="unmute"
                          className="w-4 h-4 sm:w-auto sm:h-auto"
                        />
                      )}
                    </button>

                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-0 group-hover:w-16 sm:group-hover:w-20 opacity-0 group-hover:opacity-100 transition-all duration-300 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                  </div>

                  {/* Volume button only - visible on small screens */}
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded-full sm:hidden"
                  >
                    {isMuted || volume === 0 ? (
                      <img
                        src={allImgPaths.muteIcon}
                        alt="mute"
                        className="w-4 h-4"
                      />
                    ) : (
                      <img
                        src={allImgPaths.unmuteIcon}
                        alt="unmute"
                        className="w-4 h-4"
                      />
                    )}
                  </button>

                  {/* Fullscreen button moved up to replace transcript button */}

                  {/* Fullscreen button */}
                  <button
                    onClick={toggleFullScreen}
                    className="p-1 rounded-full"
                  >
                    <img
                      src={allImgPaths.fullscreenIcon}
                      alt="fullscreen"
                      className="w-4 h-4 sm:w-auto sm:h-auto"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Section - Responsive layout */}
          {_transcription && _transcription.length > 0 && (
            <motion.div
              ref={transcriptRef}
              initial={{ opacity: 0, width: 0, x: 50 }}
              animate={{
                opacity: showTranscript ? 1 : 0,
                width: showTranscript
                  ? window.innerWidth >= 1024
                    ? "30%"
                    : "100%"
                  : 0,
                x: showTranscript ? 0 : 50,
                scale: showTranscript ? 1 : 0.95,
              }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1.0], // Using cubic-bezier for consistent easing
                opacity: { duration: 0.2 },
                scale: { duration: 0.25 },
              }}
              style={{
                height: "100vh",
                // height: videoHeight && window.innerWidth >= 768 ? `${videoHeight}px` : "auto",
                pointerEvents: showTranscript ? "auto" : "none",
                transformOrigin: "right center",
                minWidth: showTranscript
                  ? window.innerWidth >= 1024
                    ? "30%"
                    : "100%"
                  : 0,
              }}
              className="flex overflow-hidden flex-col w-full rounded-lg backdrop-blur-sm bg-gray-900/90"
            >
              {/* Transcript header with title and close button - sticky */}
              <div className="sticky top-0 z-10 backdrop-blur-sm bg-gray-900/90">
                <div className="flex justify-between items-center p-2 border-b border-gray-700/50">
                  <h3 className="text-sm font-medium text-white sm:text-base">
                    Transcript
                  </h3>
                  <div className="hidden">
                    <span className="text-xs sm:text-sm md:text-base">
                      <Switch
                        id="showTimestamp"
                        checked={showTimestamp}
                        label={
                          <span className="text-sm text-white">
                            {showTimestamp ? "Hide" : "Show"} Timestamp
                          </span>
                        }
                        onChange={() => setShowTimestamp(!showTimestamp)}
                      />
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {size(transcription) > 0 && (
                      <button
                        className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-700"
                        onClick={handleDownloadTranscription}
                      >
                        <Tooltip
                          content={translate("common.downloadTranscription")}
                          place="top"
                        >
                          <img
                            src={allImgPaths.downloadIcon3}
                            alt="download"
                            className="w-5 h-5"
                          />
                        </Tooltip>
                      </button>
                    )}
                    <div>
                      <button
                        onClick={toggleTranscript}
                        className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-700"
                        aria-label="Close"
                      >
                        <Tooltip
                          content={translate("common.close")}
                          place="top"
                        >
                          <img
                            src={allImgPaths.crossIconWhite}
                            alt="Close"
                            className="w-5 h-5"
                          />
                        </Tooltip>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search transcript input */}
                <div className="relative p-2">
                  <input
                    type="text"
                    placeholder="Search transcript..."
                    className="p-2 w-full text-xs text-white rounded sm:text-sm bg-gray-800/70 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-2 top-1/2 text-gray-400 transform -translate-y-1/2 hover:text-white"
                      onClick={() => setSearchQuery("")}
                    >
                      <img
                        src={allImgPaths.crossSkyBlue}
                        alt="clear"
                        width={14}
                        height={14}
                      />
                    </button>
                  )}
                </div>

                {/* No results message */}
                {searchQuery && filteredTranscript.length === 0 && (
                  <div className="py-4 text-xs text-center text-gray-400 sm:text-sm">
                    No matching results found
                  </div>
                )}
              </div>

              <div className="px-2 mt-2 space-y-2">
                <div
                  className="transcript-container overflow-y-auto max-h-[300px] md:max-h-[calc(100vh_-_400px)] pr-2"
                  onScroll={handleUserScroll}
                >
                  {(searchQuery ? filteredTranscript : _transcription).map(
                    (item, index) => {
                      const startTime = timeToSeconds(item.start_time);
                      const endTime = timeToSeconds(item.end_time);
                      const isActive =
                        currentTime >= startTime && currentTime <= endTime;

                      return (
                        <div
                          key={index}
                          className={`transcript-item p-2 rounded-lg transition-all duration-200 cursor-pointer ${isActive ? "text-white transcript-item-active bg-tertiary-900" : "text-gray-300 hover:bg-secondary-50/20"}`}
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = startTime;
                              setCurrentTime(startTime);
                              videoRef.current.play();
                              setIsPlaying(true);
                            }
                          }}
                        >
                          <div className="flex flex-col items-start">
                            {showTimestamp && (
                              <span className="p-1 font-mono text-xs text-gray-300 whitespace-nowrap rounded bg-primary-600">
                                {item.startTime}
                              </span>
                            )}
                            <p className="pt-0.5 text-xs sm:text-sm">
                              <Highlighter
                                className=""
                                highlightClassName="bg-secondary-600 p-[1px] rounded"
                                searchWords={[searchQuery]}
                                autoEscape={true}
                                textToHighlight={item.text}
                              />
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
