// js/state.js

// Mutable application state
export let currentPageIndex = 0;
export let isPlaying = false;
export let repeatMode = 0; // Default determined by settings.js
export let isMuted = false; // Default determined by settings.js
export let previousVolume = 1; // Default determined by settings.js
export let currentLanguage = 'en'; // Default determined by settings.js/i18n.js
export let translations = {};
export let totalPagesInLibrary = 0;
export let currentSpeed = 1.0; // Default determined by settings.js

// Functions to update state (optional, but good practice)
export function setCurrentPageIndex(index) { currentPageIndex = index; }
export function setIsPlaying(playing) { isPlaying = playing; }
export function setRepeatMode(mode) { repeatMode = mode; }
export function setIsMuted(muted) { isMuted = muted; }
export function setPreviousVolume(volume) { previousVolume = volume; }
export function setCurrentLanguage(lang) { currentLanguage = lang; }
export function setTranslations(trans) { translations = trans; }
export function setTotalPages(total) { totalPagesInLibrary = total; }
export function setCurrentSpeed(speed) { currentSpeed = speed; }