// js/main.js - Main Application Entry Point

// Import necessary modules and functions
import * as dom from './dom.js';
import * as state from './state.js';
import { LS_KEYS } from './constants.js';
// Import ONLY functions actually exported by settings.js
import { loadSettings, saveVolume, saveMutedState, saveRepeatMode, saveSpeed, saveLastPageIndex } from './settings.js';
// Import ONLY functions actually exported by i18n.js
import { loadTranslations, applyTranslations, setLanguage } from './i18n.js';
// Import ONLY functions actually exported by utils.js
import { formatTime } from './utils.js';
// Import UI update functions from ui.js
import { updateVolumeIcon, updateVolumeFill, updateSpeedFill, updateSpeedDisplay, updateRepeatButtonUI, updateRepeatButtonUITitle, updatePageBadge, resetProgressUI, updatePlayPauseButton, updatePlayerInfo } from './ui.js';
// Import library functions (ensure populateLibrary is imported)
import { populateLibrary, openLibrary, closeLibrary, updateLibrarySelection } from './library.js';
// Import all audio functions under 'player' namespace
import * as player from './audio.js';

// Declare global 'pages' from data.js
/* global pages */

// --- Theme Management (Defined here as it manipulates global DOM/localStorage) ---
function applyTheme(theme) {
    if (!dom.themeToggleButton) return;
    dom.htmlEl.classList.toggle('dark', theme === 'dark');
    if (dom.themeToggleIcon) dom.themeToggleIcon.className = theme === 'dark' ? 'fas fa-moon text-sm' : 'fas fa-sun text-sm';
}

function toggleTheme() {
    const newTheme = dom.htmlEl.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(LS_KEYS.THEME, newTheme); // Save preference
}

function loadTheme() {
    const storedTheme = localStorage.getItem(LS_KEYS.THEME);
    const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    applyTheme(storedTheme || (systemPrefersDark ? 'dark' : 'light'));
}


// --- Initialization ---
async function initializeApp() {
    console.log("Initializing App...");
    // 1. Load Theme preference early using function defined above
    loadTheme();

    // 2. Load Language preference & translations
    state.setCurrentLanguage(localStorage.getItem(LS_KEYS.LANGUAGE) || 'en');
    await setLanguage(state.currentLanguage); // Sets lang, loads translations, applies dir/font

    // 3. Check if page data is available (loaded via data.js script tag)
    if (typeof pages !== 'undefined' && pages.length > 0) {
        state.setTotalPages(pages.length);

        // 4. Load other settings (Volume, Mute, Repeat, Speed, Last Page)
        loadSettings(); // Sets initial state based on localStorage

        // 5. Initialize Player UI state based on loaded settings
        initializePlayerUI(); // This calls populateLibrary internally now

        // 6. Setup Event Listeners
        setupEventListeners();

        console.log("App Initialized Successfully.");

    } else {
        handleLoadError("Failed to initialize: 'pages' data not found. Ensure data.js loads before main.js.");
    }
}

function handleLoadError(message) {
    console.error(message);
    // Display error state in UI
    if (dom.pageTitle) dom.pageTitle.textContent = "Error";
    if (dom.surahReciter) dom.surahReciter.textContent = "Could not load audio data.";
    if (dom.libraryList) dom.libraryList.innerHTML = `<p class="p-2 text-sm text-red-500">${state.translations?.loadingError || 'Failed to load pages.'}</p>`;
    // Disable controls maybe? Add a class to the body/app container
    dom.bodyEl?.classList.add('app-error');
}

function initializePlayerUI() {
    // Assumes settings and state are loaded
    populateLibrary(); // Build library list using current translations
    player.loadPage(state.currentPageIndex, false); // Load initial page data based on loaded index, don't play
    updateVolumeFill(); // Update visual fills based on loaded settings
    updateSpeedFill();
    updateRepeatButtonUI(); // Set correct initial icon/state for repeat button
    // applyTranslations() called within setLanguage during init
}


// --- Event Handlers --- (Delegated to specific modules where appropriate)

function handleProgressScrub() {
    if (dom.audio && dom.audio.duration && isFinite(dom.audio.duration) && dom.progressBar) {
        dom.audio.currentTime = dom.progressBar.value;
        // Update visual fill immediately for responsiveness
        if (dom.progressBarFill) dom.progressBarFill.style.width = `${(dom.audio.currentTime / dom.audio.duration) * 100}%`;
    }
}

function handleVolumeScrub() {
    if (!dom.volumeSlider || !dom.audio) return;
    let newVolume = parseFloat(dom.volumeSlider.value) / 100;
    dom.audio.volume = newVolume;
    let newMutedState = newVolume === 0;
    let volumeToSave = state.previousVolume; // Default to saving previous non-zero volume

    if (newMutedState !== state.isMuted) { // Mute state changed via slider
        state.setIsMuted(newMutedState);
        saveMutedState(state.isMuted);
    }

    if (!state.isMuted) { // Only update previousVolume and save if not muted
        state.setPreviousVolume(newVolume);
        volumeToSave = newVolume; // Save the current volume
        saveVolume(volumeToSave);
    } else {
        // If slider muted, save the volume it *had* before hitting zero
        saveVolume(state.previousVolume);
    }

    updateVolumeIcon(state.isMuted, newVolume);
    updateVolumeFill();
}

function handleMuteToggle() {
    state.setIsMuted(!state.isMuted); // Toggle state first
    if (state.isMuted) {
        // Store volume *before* setting audio element to 0
        state.setPreviousVolume(dom.audio.volume > 0 ? dom.audio.volume : state.previousVolume);
        dom.audio.volume = 0;
        if (dom.volumeSlider) dom.volumeSlider.value = 0;
    } else {
        let restoreVolume = (state.previousVolume === 0 || typeof state.previousVolume === 'undefined') ? 0.5 : state.previousVolume;
        dom.audio.volume = restoreVolume;
        if (dom.volumeSlider) dom.volumeSlider.value = restoreVolume * 100;
    }
    updateVolumeIcon(state.isMuted, dom.audio.volume);
    updateVolumeFill();
    saveMutedState(state.isMuted); // Save mute state
    // Also save the underlying volume when unmuting or the stored one if muting
    saveVolume(state.isMuted ? state.previousVolume : dom.audio.volume);
}

function handleSpeedScrub() {
    if (!dom.speedSlider || !dom.audio) return;
    state.setCurrentSpeed(parseFloat(dom.speedSlider.value));
    dom.audio.playbackRate = state.currentSpeed;
    updateSpeedFill();
    updateSpeedDisplay(state.currentSpeed); // Update the displayed value
    saveSpeed(state.currentSpeed); // Save setting on scrub
}

async function handleLanguageChange(event) {
     const newLang = event.target.value;
     await setLanguage(newLang); // Sets language, applies translations
     // *NOW* repopulate the library with the new language's labels
     populateLibrary();
     // Update other UI elements that might depend on state AND language
     updateSpeedDisplay(state.currentSpeed);
     updateRepeatButtonUITitle(); // Update tooltip text
     updatePageBadge(); // Update "Page X of Y" text
}


// --- Setup Event Listeners ---
function setupEventListeners() {
    console.log("Setting up event listeners...");
    // Player Controls
    dom.playPauseButton?.addEventListener('click', player.togglePlayPause);
    dom.forwardButton?.addEventListener('click', player.nextPage);
    dom.backwardButton?.addEventListener('click', player.prevPage);
    dom.repeatButton?.addEventListener('click', toggleRepeat); // toggleRepeat defined below

    // Audio Element Events
    dom.audio?.addEventListener('timeupdate', player.handleAudioTimeUpdate);
    dom.audio?.addEventListener('loadedmetadata', player.handleAudioLoadedMetadata);
    dom.audio?.addEventListener('ended', player.handleAudioEnded);
    dom.audio?.addEventListener('canplay', player.handleAudioCanPlay);
    dom.audio?.addEventListener('error', player.handleAudioError);
    dom.audio?.addEventListener('stalled', player.handleAudioStalled);
    dom.audio?.addEventListener('waiting', player.handleAudioWaiting);
    dom.audio?.addEventListener('playing', player.handleAudioPlaying);
    dom.audio?.addEventListener('pause', player.handleAudioPause);

    // Progress Bar Interaction
    dom.progressBar?.addEventListener('input', handleProgressScrub);

    // Volume Control Interaction
    dom.volumeSlider?.addEventListener('input', handleVolumeScrub);
    dom.volumeMuteButton?.addEventListener('click', handleMuteToggle);

    // Speed Control Interaction
    dom.speedSlider?.addEventListener('input', handleSpeedScrub);

    // Library Interaction
    dom.libraryLink?.addEventListener('click', openLibrary);
    dom.closeLibraryButton?.addEventListener('click', closeLibrary);
    dom.libraryOverlay?.addEventListener('click', closeLibrary);

    // Theme and Language Switching
    // Use toggleTheme defined in this file
    dom.themeToggleButton?.addEventListener('click', toggleTheme);
    dom.languageSwitcher?.addEventListener('change', handleLanguageChange);

    // System theme listener (optional)
    const pds = window.matchMedia?.('(prefers-color-scheme: dark)');
    // Use applyTheme defined in this file
    pds?.addEventListener('change', (e) => { if (!localStorage.getItem(LS_KEYS.THEME)) applyTheme(e.matches ? 'dark' : 'light'); });

    console.log("Event listeners set up.");
}

// Specific handler for repeat toggle as it modifies state and calls UI update
function toggleRepeat() {
    state.setRepeatMode((state.repeatMode + 1) % 3); // Cycle 0, 1, 2
    updateRepeatButtonUI(); // Update the button's look
    saveRepeatMode(state.repeatMode); // Save the new mode
}

// --- Start ---
initializeApp();