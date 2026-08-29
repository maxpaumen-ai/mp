class VideoCarousel {
  constructor(container) {
    this.container = container;
    this.videoItems = this.container.querySelectorAll(".video-item");
    this.enableAutoplay = this.container.dataset.enableAutoplay === "true";
    this.showSoundControls = this.container.dataset.showSoundControls === "true";
    this.playButtonSize = parseInt(this.container.dataset.playButtonSize) || 30;
    this.soundButtonSize = parseInt(this.container.dataset.soundButtonSize) || 30;
    this.playButtonBgColor = this.container.dataset.playButtonBgColor || "#000000";
    this.playButtonBgOpacity = parseInt(this.container.dataset.playButtonBgOpacity) || 35;
    this.soundButtonBgColor = this.container.dataset.soundButtonBgColor || "#000000";
    this.soundButtonBgOpacity = parseInt(this.container.dataset.soundButtonBgOpacity) || 35;

    this.init();
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  init() {
    if (this.enableAutoplay) {
      this.videoItems.forEach((item) => {
        this.playVideoInline(item, true);
        // No play button handler needed for autoplay - only sound button is visible
      });
    } else {
      this.videoItems.forEach((item) => {
        const playButton = item.querySelector(".testimonial-play-button");
        if (playButton) {
          playButton.addEventListener("click", (e) => this.handlePlayButtonClick(e, item));
        }
      });
    }

    // Add event listeners for static sound buttons
    this.videoItems.forEach((item) => {
      const soundButton = item.querySelector(".video-sound-button");
      if (soundButton) {
        soundButton.addEventListener("click", (e) => this.handleSoundButtonClick(e, item));
        // Initialize button state - default to muted
        soundButton.dataset.muted = "true";
        this.updateSoundButtonVisual(soundButton, true);
      }
    });
  }

  playVideoInline(item, isAutoplay = false) {
    const videoTypeElement = item.querySelector(".video-type");
    const videoThumbnail = item.querySelector(".video-thumbnail");
    if (!videoTypeElement || !videoThumbnail) return;

    const videoType = videoTypeElement.dataset.type;
    const videoId = videoTypeElement.dataset.id;
    const shopifyVideoId = videoTypeElement.dataset.videoId;

    // Clear the thumbnail content first
    const thumbnailImg = videoThumbnail.querySelector(".carousel-video");
    if (thumbnailImg) thumbnailImg.style.display = "none";

    // Create video container
    let videoContainer = videoThumbnail.querySelector(".inline-video-container");
    if (!videoContainer) {
      videoContainer = document.createElement("div");
      videoContainer.className = "inline-video-container";
      videoContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 5;
      `;
      videoThumbnail.appendChild(videoContainer);
    }

    let videoContent = "";
    let soundButton = null;

    if (videoType === "youtube") {
      // Always start muted for browser compatibility, then unmute programmatically for manual play
      videoContent = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&enablejsapi=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

      if (!isAutoplay && this.showSoundControls) {
        soundButton = this.createSoundButton("youtube", videoContainer, false); // Start unmuted state
      } else if (isAutoplay && this.showSoundControls) {
        soundButton = this.createSoundButton("youtube", videoContainer, true); // Start muted for autoplay
      }
    } else if (videoType === "vimeo") {
      // Always start muted for browser compatibility, then unmute programmatically for manual play
      videoContent = `<iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&api=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

      if (!isAutoplay && this.showSoundControls) {
        soundButton = this.createSoundButton("vimeo", videoContainer, false); // Start unmuted state
      } else if (isAutoplay && this.showSoundControls) {
        soundButton = this.createSoundButton("vimeo", videoContainer, true); // Start muted for autoplay
      }
    } else if (videoType === "shopify") {
      const hiddenVideoData = item.querySelector(".hidden-video-data");
      if (hiddenVideoData) {
        let videoTag = hiddenVideoData.innerHTML;
        // Always start muted for browser compatibility
        videoTag = videoTag.replace("<video", `<video autoplay muted loop playsinline`);
        videoContent = videoTag;

        if (!isAutoplay && this.showSoundControls) {
          soundButton = this.createSoundButton("shopify", videoContainer, false); // Start unmuted state
        } else if (isAutoplay && this.showSoundControls) {
          soundButton = this.createSoundButton("shopify", videoContainer, true); // Start muted for autoplay
        }
      }
    }

    videoContainer.innerHTML = videoContent;

    if (soundButton) {
      videoContainer.appendChild(soundButton);
    }

    // Mark as playing
    item.classList.add("video-playing");

    // Update play button to pause button
    const playButton = item.querySelector(".testimonial-play-button");
    if (playButton && !isAutoplay) {
      this.updateButtonToPause(playButton);
    }

    // For manual playback, check static sound button state and unmute if needed
    if (!isAutoplay && this.showSoundControls) {
      const staticSoundButton = item.querySelector(".video-sound-button");
      const shouldUnmute = staticSoundButton && staticSoundButton.dataset.muted === "false";

      if (shouldUnmute) {
        setTimeout(() => {
          this.unmuteVideo(videoType, videoContainer);
        }, 500);
      }
    }
  }

  handlePlayButtonClick(e, item) {
    e.preventDefault();
    e.stopPropagation();

    const isPlaying = item.classList.contains("video-playing");
    const isPaused = item.classList.contains("video-paused");

    if (isPlaying) {
      this.pauseVideo(item);
    } else if (isPaused) {
      this.resumeVideo(item);
    } else {
      this.playVideoInline(item, false);
    }
  }

  handleSoundButtonClick(e, item) {
    e.preventDefault();
    e.stopPropagation();

    const soundButton = e.target.closest(".video-sound-button");
    if (!soundButton) return;

    const isPlaying = item.classList.contains("video-playing");

    if (isPlaying) {
      // Video is playing, toggle sound on the active video
      const videoContainer = item.querySelector(".inline-video-container");
      if (videoContainer) {
        const videoTypeElement = item.querySelector(".video-type");
        const videoType = videoTypeElement ? videoTypeElement.dataset.type : "shopify";
        this.toggleSound(soundButton, videoType, videoContainer);
      }
    } else {
      // Video is not playing, just toggle the button state visually
      const currentState = soundButton.dataset.muted || "true";
      const newState = currentState === "true" ? "false" : "true";
      soundButton.dataset.muted = newState;

      this.updateSoundButtonVisual(soundButton, newState === "true");
    }
  }

  pauseVideo(item) {
    const videoContainer = item.querySelector(".inline-video-container");
    const playButton = item.querySelector(".testimonial-play-button");

    if (videoContainer) {
      const iframe = videoContainer.querySelector("iframe");
      const video = videoContainer.querySelector("video");

      if (iframe) {
        const src = iframe.src;
        if (src.includes("youtube.com")) {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
        } else if (src.includes("vimeo.com")) {
          iframe.contentWindow.postMessage('{"method":"pause"}', "*");
        }
      } else if (video) {
        video.pause();
      }

      // Mark container as paused instead of removing it
      videoContainer.classList.add("paused");
      videoContainer.style.display = "none";
    }

    // Show thumbnail again
    const thumbnailImg = item.querySelector(".carousel-video");
    if (thumbnailImg) thumbnailImg.style.display = "block";

    // Update button back to play
    if (playButton) {
      this.updateButtonToPlay(playButton);
    }

    // Remove playing class but keep paused state
    item.classList.remove("video-playing");
    item.classList.add("video-paused");
  }

  resumeVideo(item) {
    const videoContainer = item.querySelector(".inline-video-container");
    const playButton = item.querySelector(".testimonial-play-button");
    const thumbnailImg = item.querySelector(".carousel-video");

    if (videoContainer) {
      const iframe = videoContainer.querySelector("iframe");
      const video = videoContainer.querySelector("video");

      // Show video container again
      videoContainer.style.display = "block";
      videoContainer.classList.remove("paused");

      // Resume playback
      if (iframe) {
        const src = iframe.src;
        if (src.includes("youtube.com")) {
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
        } else if (src.includes("vimeo.com")) {
          iframe.contentWindow.postMessage('{"method":"play"}', "*");
        }
      } else if (video) {
        video.play();
      }
    }

    // Hide thumbnail
    if (thumbnailImg) thumbnailImg.style.display = "none";

    // Update button to pause
    if (playButton) {
      this.updateButtonToPause(playButton);
    }

    // Update state classes
    item.classList.remove("video-paused");
    item.classList.add("video-playing");
  }

  updateButtonToPause(button) {
    const iconSize = Math.round(this.playButtonSize * 0.8);
    button.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px;">
        <rect x="6" y="4" width="4" height="16" fill="white"/>
        <rect x="14" y="4" width="4" height="16" fill="white"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Pause video");
  }

  updateButtonToPlay(button) {
    const iconSize = Math.round(this.playButtonSize * 0.8);
    button.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px;">
        <path d="M8 5v14l11-7z" fill="white"/>
      </svg>
    `;
    button.setAttribute("aria-label", "Play video");
  }

  updateSoundButtonVisual(button, isMuted) {
    if (!button) return; // Safety check to prevent null reference errors

    const iconSize = Math.round(this.soundButtonSize * 0.67);

    if (isMuted) {
      // Show muted icon
      button.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
      button.setAttribute("aria-label", "Turn on sound");
    } else {
      // Show unmuted icon
      button.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
      button.setAttribute("aria-label", "Mute video");
    }
  }

  createSoundButton(videoType, container, startMuted = true) {
    const soundButton = document.createElement("button");
    soundButton.className = "video-sound-button";
    const iconSize = Math.round(this.soundButtonSize * 0.67);
    const rgb = this.hexToRgb(this.soundButtonBgColor);
    const opacity = this.soundButtonBgOpacity / 100;
    soundButton.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: ${this.soundButtonSize}px;
      height: ${this.soundButtonSize}px;
      border-radius: 50%;
      background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity});
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 20;
      transition: transform 0.2s ease, background 0.2s ease;
    `;

    // Set initial state based on startMuted parameter
    if (startMuted) {
      soundButton.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
      soundButton.setAttribute("aria-label", "Turn on sound");
      soundButton.dataset.muted = "true";
    } else {
      soundButton.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
      soundButton.setAttribute("aria-label", "Mute video");
      soundButton.dataset.muted = "false";
    }

    soundButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSound(soundButton, videoType, container);
    });

    soundButton.addEventListener("mouseenter", () => {
      soundButton.style.transform = "scale(1.1)";
      const hoverOpacity = Math.min((this.soundButtonBgOpacity + 16) / 100, 1);
      soundButton.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${hoverOpacity})`;
    });

    soundButton.addEventListener("mouseleave", () => {
      soundButton.style.transform = "scale(1)";
      soundButton.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    });

    return soundButton;
  }

  unmuteVideo(videoType, container) {
    const iframe = container.querySelector("iframe");
    const video = container.querySelector("video");
    const soundButton = container.querySelector(".video-sound-button");

    if (videoType === "youtube" && iframe) {
      iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', "*");
    } else if (videoType === "vimeo" && iframe) {
      iframe.contentWindow.postMessage('{"method":"setVolume","value":1}', "*");
    } else if (videoType === "shopify" && video) {
      video.muted = false;
    }

    // Update sound button to reflect unmuted state
    if (soundButton) {
      const iconSize = Math.round(this.soundButtonSize * 0.67);
      soundButton.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
      soundButton.setAttribute("aria-label", "Mute video");
      soundButton.dataset.muted = "false";
    }
  }

  toggleSound(button, videoType, container) {
    const iframe = container.querySelector("iframe");
    const video = container.querySelector("video");
    const isMuted = button.dataset.muted === "true";

    if (videoType === "youtube" && iframe) {
      const command = isMuted ? "unMute" : "mute";
      iframe.contentWindow.postMessage(`{"event":"command","func":"${command}","args":""}`, "*");
    } else if (videoType === "vimeo" && iframe) {
      const volume = isMuted ? 1 : 0;
      iframe.contentWindow.postMessage(`{"method":"setVolume","value":${volume}}`, "*");
    } else if (videoType === "shopify" && video) {
      video.muted = !isMuted;
    }

    // Update button state
    button.dataset.muted = !isMuted;

    const iconSize = Math.round(this.soundButtonSize * 0.67);

    if (!isMuted) {
      button.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
      button.setAttribute("aria-label", "Mute video");
    } else {
      button.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: ${iconSize}px; height: ${iconSize}px; fill: white;">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
      button.setAttribute("aria-label", "Turn on sound");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const videoCarousels = document.querySelectorAll(".video-carousel-container");
  videoCarousels.forEach((carousel) => {
    new VideoCarousel(carousel);
  });
});
