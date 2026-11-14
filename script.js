let DURATION = 159;

const state = {
  dark: true,
  playing: false,
  currentTime: 0,
  volume: 72,
  previousVolume: 72,
  settingsOpen: false,
  quality: "1080p",
  speed: 1,
  cc: false,
  theater: false,
  expanded: false,
};

const app = document.getElementById("app");
const player = document.getElementById("player");
const showcase = document.getElementById("showcase");
const heroPlay = document.getElementById("hero-play");
const playToggle = document.getElementById("play-toggle");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");
const timeline = document.getElementById("timeline");
const timelineFill = document.getElementById("timeline-fill");
const timestamp = document.getElementById("timestamp");
const volumeInput = document.getElementById("volume");
const muteButton = document.getElementById("mute");
const volNear = document.getElementById("vol-near");
const volFar = document.getElementById("vol-far");
const volMute = document.getElementById("vol-mute");
const settingsToggle = document.getElementById("settings-toggle");
const settingsMenu = document.getElementById("settings-menu");
const captionsButton = document.getElementById("captions");
const caption = document.getElementById("caption");
const theaterButton = document.getElementById("theater");
const themeToggle = document.getElementById("theme-toggle");
const themeSun = document.getElementById("theme-sun");
const themeMoon = document.getElementById("theme-moon");
const expandButton = document.getElementById("expand");
const expandLabel = document.getElementById("expand-label");
const expandIcon = document.querySelector("#expand-icon path");
const description = document.getElementById("description");
const details = document.getElementById("details");
const toast = document.getElementById("toast");
const video = document.getElementById("video");
const timelineBuffer = document.getElementById("timeline-buffer");

let noticeTimer = 0;

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function showNotice(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function syncTheme() {
  app.classList.toggle("dark-theme", state.dark);
  app.classList.toggle("light-theme", !state.dark);
  themeSun.classList.toggle("selected", !state.dark);
  themeMoon.classList.toggle("selected", state.dark);
  themeToggle.setAttribute("aria-label", `Switch to ${state.dark ? "light" : "dark"} mode`);
}

function syncTime() {
  const progress = (state.currentTime / DURATION) * 100;
  timeline.value = String(state.currentTime);
  timelineFill.style.width = `${progress}%`;
  timestamp.innerHTML = `${formatTime(state.currentTime)} <i>/</i> <span>${formatTime(DURATION)}</span>`;
}

function seekTo(time) {
  state.currentTime = Math.max(0, Math.min(DURATION, time));
  video.currentTime = state.currentTime;
  player.classList.add("has-started");
  syncTime();
}

function seek(amount) {
  seekTo(state.currentTime + amount);
}

function syncPlayback() {
  player.classList.toggle("is-playing", state.playing);
  heroPlay.hidden = state.playing;
  iconPlay.toggleAttribute("hidden", state.playing);
  iconPause.toggleAttribute("hidden", !state.playing);
  const label = state.playing ? "Pause" : "Play";
  playToggle.setAttribute("aria-label", label);
  playToggle.title = label;
}

function syncVolume() {
  video.volume = state.volume / 100;
  video.muted = state.volume === 0;
  volumeInput.value = String(state.volume);
  volumeInput.style.setProperty("--volume", `${state.volume}%`);
  const muted = state.volume === 0;
  muteButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  muteButton.title = muted ? "Unmute" : "Mute";
  volNear.hidden = muted;
  volFar.hidden = state.volume <= 45;
  volMute.hidden = !muted;
}

function syncSettings() {
  settingsMenu.hidden = !state.settingsOpen;
  settingsToggle.classList.toggle("control-active", state.settingsOpen);
  settingsToggle.setAttribute("aria-expanded", String(state.settingsOpen));
  settingsToggle.setAttribute("aria-pressed", String(state.settingsOpen));
  document.querySelectorAll("[data-quality]").forEach((button) => {
    button.classList.toggle("active", button.dataset.quality === state.quality);
  });
  document.querySelectorAll("[data-speed]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.speed) === state.speed);
  });
}

function syncCaptions() {
  caption.hidden = !state.cc;
  captionsButton.classList.toggle("control-active", state.cc);
  captionsButton.setAttribute("aria-pressed", String(state.cc));
}

function syncTheater() {
  showcase.classList.toggle("theater", state.theater);
  theaterButton.classList.toggle("control-active", state.theater);
  theaterButton.setAttribute("aria-pressed", String(state.theater));
}

function syncExpanded() {
  description.classList.toggle("expanded", state.expanded);
  details.hidden = !state.expanded;
  expandLabel.textContent = state.expanded ? "Show less" : "Show more";
  expandButton.setAttribute("aria-expanded", String(state.expanded));
  expandIcon.setAttribute("d", state.expanded ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6");
}

const QUALITY_SOURCES = {
  "720p": "assets/safinum-recording-720p.mp4",
  "1080p": "assets/safinum-recording.mp4",
};

function setQuality(quality) {
  if (quality === state.quality || !QUALITY_SOURCES[quality]) return;
  const resumeAt = video.currentTime;
  const wasPlaying = !video.paused && !video.ended;
  const previous = state.quality;
  state.quality = quality;
  syncSettings();

  const onReady = () => {
    video.removeEventListener("error", onFail);
    video.currentTime = Math.min(resumeAt, video.duration || resumeAt);
    video.playbackRate = state.speed;
    if (wasPlaying) video.play().catch(() => {});
    showNotice(`Quality: ${quality}`);
  };
  const onFail = () => {
    video.removeEventListener("loadedmetadata", onReady);
    state.quality = previous;
    syncSettings();
    video.src = QUALITY_SOURCES[previous];
    video.currentTime = resumeAt;
    showNotice(`${quality} is not available`);
  };
  video.addEventListener("loadedmetadata", onReady, { once: true });
  video.addEventListener("error", onFail, { once: true });
  video.src = QUALITY_SOURCES[quality];
  video.load();
}

function togglePlay() {
  if (video.paused) {
    if (video.ended) video.currentTime = 0;
    player.classList.add("has-started");
    video.play().catch(() => showNotice("Unable to play the video"));
  } else {
    video.pause();
  }
}

video.addEventListener("loadedmetadata", () => {
  if (!Number.isFinite(video.duration)) return;
  DURATION = video.duration;
  timeline.max = String(DURATION);
  syncTime();
});

video.addEventListener("timeupdate", () => {
  state.currentTime = video.currentTime;
  syncTime();
});

video.addEventListener("progress", () => {
  if (!video.buffered.length) return;
  const end = video.buffered.end(video.buffered.length - 1);
  timelineBuffer.style.width = `${Math.min(100, (end / DURATION) * 100)}%`;
});

["play", "pause", "ended"].forEach((type) => {
  video.addEventListener(type, () => {
    state.playing = !video.paused && !video.ended;
    syncPlayback();
  });
});

video.addEventListener("error", () => showNotice("Video file could not be loaded"));
video.addEventListener("click", togglePlay);

async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await player.requestFullscreen();
  } catch {
    showNotice("Fullscreen unavailable");
  }
}

themeToggle.addEventListener("click", () => {
  state.dark = !state.dark;
  syncTheme();
});

heroPlay.addEventListener("click", togglePlay);
playToggle.addEventListener("click", togglePlay);
document.getElementById("rewind").addEventListener("click", () => seek(-10));
document.getElementById("forward").addEventListener("click", () => seek(10));

timeline.addEventListener("input", (event) => {
  seekTo(Number(event.target.value));
});

volumeInput.addEventListener("input", (event) => {
  const next = Number(event.target.value);
  if (next > 0) state.previousVolume = next;
  state.volume = next;
  syncVolume();
});

muteButton.addEventListener("click", () => {
  if (state.volume > 0) {
    state.previousVolume = state.volume;
    state.volume = 0;
  } else {
    state.volume = state.previousVolume || 72;
  }
  syncVolume();
});

settingsToggle.addEventListener("click", () => {
  state.settingsOpen = !state.settingsOpen;
  syncSettings();
});

player.addEventListener("mouseleave", () => {
  if (!state.settingsOpen) return;
  state.settingsOpen = false;
  syncSettings();
});

document.getElementById("quality-choices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quality]");
  if (!button) return;
  setQuality(button.dataset.quality);
});

document.getElementById("speed-choices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-speed]");
  if (!button) return;
  state.speed = Number(button.dataset.speed);
  video.playbackRate = state.speed;
  syncSettings();
});

captionsButton.addEventListener("click", () => {
  state.cc = !state.cc;
  syncCaptions();
});

theaterButton.addEventListener("click", () => {
  state.theater = !state.theater;
  syncTheater();
});

document.getElementById("fullscreen").addEventListener("click", fullscreen);

expandButton.addEventListener("click", () => {
  state.expanded = !state.expanded;
  syncExpanded();
});

details.addEventListener("click", (event) => {
  const chapter = event.target.closest("[data-time]");
  if (!chapter) return;
  seekTo(Number(chapter.dataset.time));
});

syncTheme();
syncTime();
syncVolume();
syncSettings();
syncCaptions();
syncTheater();
syncExpanded();
