// js/dom.js

// Select all necessary DOM elements once
export const htmlEl = document.documentElement;
export const bodyEl = document.body;
export const audio = document.getElementById('audio-player');
export const coverImage = document.getElementById('cover-image');
export const pageTitle = document.getElementById('page-title');
export const surahReciter = document.getElementById('surah-reciter');
export const progressBar = document.getElementById('progress-bar');
export const progressBarFill = document.getElementById('progress-bar-fill');
export const currentTimeDisplay = document.getElementById('current-time');
export const durationDisplay = document.getElementById('duration');
export const repeatButton = document.getElementById('repeat');
export const repeatIcon = repeatButton ? repeatButton.querySelector('i') : null;
export const backwardButton = document.getElementById('backward');
export const playPauseButton = document.getElementById('play-pause');
export const playPauseIcon = playPauseButton ? playPauseButton.querySelector('i') : null;
export const forwardButton = document.getElementById('forward');
export const volumeMuteButton = document.getElementById('volume-mute');
export const volumeMuteIcon = volumeMuteButton ? volumeMuteButton.querySelector('i') : null;
export const volumeSlider = document.getElementById('volume-slider');
export const volumeBarFill = document.getElementById('volume-bar-fill');
export const libraryLink = document.getElementById('library-link');
export const libraryPanel = document.getElementById('library');
export const closeLibraryButton = document.getElementById('close-library');
export const libraryList = document.getElementById('library-list');
export const libraryOverlay = document.getElementById('library-overlay');
export const themeToggleButton = document.getElementById('theme-toggle');
export const themeToggleIcon = themeToggleButton ? themeToggleButton.querySelector('i') : null;
export const languageSwitcher = document.getElementById('language-switcher');
export const currentPageNumEl = document.getElementById('current-page-num');
export const pageBadgeEl = document.getElementById('current-page-badge');
export const speedSlider = document.getElementById('speed-slider');
export const speedBarFill = document.getElementById('speed-bar-fill');
export const speedValueDisplay = document.getElementById('playback-speed-value');

// Check if essential elements exist
if (!audio || !playPauseButton || !progressBar || !volumeSlider || !speedSlider || !libraryPanel) {
    console.error("Essential player elements not found in the DOM!");
    // Optionally display a user-facing error message
}