import allImgPaths from "@/assets";
import { motion } from "framer-motion";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Interface representing a time range for highlighting segments in the video
 */
interface TimeRange {
  start: number;
  end: number;
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
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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
      if (!videoRef.current) return;

      setCurrentTime(videoRef.current.currentTime);
    } catch (error) {
      console.error("handleTimeUpdate Error:", error);
    }
  }, []);

  /**
   * Handle loaded metadata event from the video element
   */
  const handleLoadedMetadata = useCallback(() => {
    try {
      if (!videoRef.current) return;

      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
    } catch (error) {
      console.error("handleLoadedMetadata Error:", error);
    }
  }, [volume]);

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

  // Scroll to current transcript item
  useEffect(() => {
    try {
      if (!showTranscript || !transcriptRef.current || !transcription?.length)
        return;

      const activeTranscriptItem = document.querySelector(
        ".transcript-item-active",
      );
      if (activeTranscriptItem) {
        activeTranscriptItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } catch (error) {
      console.error("Transcript scroll Error:", error);
    }
  }, [currentTime, showTranscript, transcription]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = initStartFrom;
    setCurrentTime(initStartFrom);
  }, [initStartFrom]);

  return (
    <div
      className={`overflow-hidden relative p-4 rounded-lg ${className}`}
      onMouseMove={handleMouseMovement}
    >
      <div
        className={`w-full ${showTranscript ? "h-3/5" : "h-full"} rounded-lg transition-all duration-300 ease-in-out`}
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full rounded-lg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onClick={togglePlay}
          playsInline
        />
      </div>

      {/* Transcript Toggle Button */}
      {transcription && transcription.length > 0 && (
        <button
          onClick={toggleTranscript}
          className="absolute top-6 right-6 z-10 p-2 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 bg-tertiary-900/80 hover:bg-tertiary-900"
          title={showTranscript ? "Hide Transcript" : "Show Transcript"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </button>
      )}

      {/* Transcript Section */}
      {transcription && transcription.length > 0 && (
        <motion.div
          ref={transcriptRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: showTranscript ? 1 : 0,
            height: showTranscript ? "auto" : 0,
          }}
          transition={{ duration: 0.3 }}
          className={`w-full max-h-2/5 bg-gray-900/90 backdrop-blur-sm rounded-lg mt-2 overflow-y-auto transition-all duration-300 ease-in-out ${showTranscript ? "p-4" : "p-0"}`}
          style={{ maxHeight: showTranscript ? "40%" : "0" }}
        >
          <div className="space-y-2">
            {transcription.map((item, index) => {
              const startTime = timeToSeconds(item.start_time);
              const endTime = timeToSeconds(item.end_time);
              const isActive =
                currentTime >= startTime && currentTime <= endTime;

              return (
                <div
                  key={index}
                  className={`transcript-item p-2 rounded-lg transition-all duration-200 cursor-pointer ${isActive ? "text-white transcript-item-active bg-tertiary-900/50" : "text-gray-300 hover:bg-gray-800/50"}`}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = startTime;
                      setCurrentTime(startTime);
                    }
                  }}
                >
                  <div className="flex items-start">
                    <span className="px-2 py-1 mr-2 font-mono text-xs text-gray-300 whitespace-nowrap bg-gray-800 rounded">
                      {item.start_time}
                    </span>
                    <p className="text-sm">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Custom controls overlay */}
      <div
        className={`bg-black/25 backdrop-blur-sm rounded-lg p-4 shadow-md px-5 md:px-11 mx-5 md:mx-9 absolute bottom-6 left-0 right-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar with highlighted segments */}
        <div
          ref={progressBarRef}
          className="relative mb-2 w-full h-2 rounded-full cursor-pointer bg-tertiary-600"
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
            className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex justify-between items-center py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="p-1 rounded-full transition-colors hover:bg-gray-700/50"
            >
              {isPlaying ? (
                <img src={allImgPaths.pauseIcon} alt="pause" />
              ) : (
                <img src={allImgPaths.playIcon} alt="play" />
              )}
            </button>

            {/* Time display */}
            <div className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Volume control */}
            <div className="flex items-center group">
              <button
                onClick={toggleMute}
                className="p-1 rounded-full transition-colors hover:bg-gray-700/50"
              >
                {isMuted || volume === 0 ? (
                  <img src={allImgPaths.muteIcon} alt="mute" />
                ) : volume < 0.5 ? (
                  <img src={allImgPaths.unmuteIcon} alt="unmute" />
                ) : (
                  <img src={allImgPaths.unmuteIcon} alt="unmute" />
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
                  className="w-0 group-hover:w-20 opacity-0 group-hover:opacity-100 transition-all duration-300 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullScreen}
              className="p-1 rounded-full transition-colors hover:bg-gray-700/50"
            >
              {isFullScreen ? (
                <img src={allImgPaths.fullscreenIcon} alt="fullscreen" />
              ) : (
                <img src={allImgPaths.fullscreenIcon} alt="fullscreen" />
              )}
            </button>
          </div>
        </div>
      </div>

      {!isPlaying && (
        <div
          className="flex absolute inset-0 justify-center items-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="flex justify-center items-center w-16 h-16 rounded-full shadow-lg backdrop-blur-sm bg-black/40">
            <img src={allImgPaths.playIcon} alt="play" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
