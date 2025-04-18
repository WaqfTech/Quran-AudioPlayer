// js/main.js - Main Application Entry Point

// Import necessary modules and functions
import * as dom from './dom.js';
import * as state from './state.js';
import { LS_KEYS } from './constants.js';
import { loadSettings, saveVolume, saveMutedState, saveRepeatMode, saveSpeed, saveLastPageIndex } from './settings.js';
import { loadTranslations, applyTranslations, setLanguage } from './i18n.js';
import { formatTime } from './utils.js';
// Import UI update functions from ui.js (NO theme functions here)
import { applyTheme as applyThemeUI, updateVolumeIcon, updateVolumeFill, updateSpeedFill, updateSpeedDisplay, updateRepeatButtonUI, updateRepeatButtonUITitle, updatePageBadge, resetProgressUI, updatePlayPauseButton, updatePlayerInfo } from './ui.js'; // Renamed theme import to avoid clash
import { populateLibrary, openLibrary, closeLibrary, updateLibrarySelection } from './library.js';
import * as player from './audio.js';

// Configuration
const AUDIO_BASE_URL = "https://quran-audio.waqftech.org";
const RECITER_PATH = "abdul-rashid-alsufi_haps-an-aasim";
const SURAH_PATH = "002_baqarah";
const DATA_JSON_URL = `${AUDIO_BASE_URL}/${RECITER_PATH}/${SURAH_PATH}/${SURAH_PATH}.json`;
const DEFAULT_COVER_IMAGE = 'images/quran_cover_placeholder.jpg';

// Global variable for processed page data
let pages = []; // This will be populated after fetching the JSON

// --- Theme Management (Defined ONLY ONCE here in main.js) ---
function applyTheme(theme) {
    // Safety check for elements
    if (!dom.htmlEl || !dom.themeToggleButton || !dom.themeToggleIcon) {
        // console.warn("Theme elements not ready for applyTheme.");
        return;
    }
    dom.htmlEl.classList.toggle('dark', theme === 'dark');
    dom.themeToggleIcon.className = theme === 'dark' ? 'fas fa-moon text-sm' : 'fas fa-sun text-sm';
}

function toggleTheme() {
    if (!dom.htmlEl) return; // Safety check
    const newTheme = dom.htmlEl.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(LS_KEYS.THEME, newTheme);
}

function loadTheme() {
    const storedTheme = localStorage.getItem(LS_KEYS.THEME);
    const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    // Apply theme after DOM is likely ready or elements are checked inside applyTheme
    applyTheme(storedTheme || (systemPrefersDark ? 'dark' : 'light'));
}

// --- Initialization ---
async function initializeApp() {
    console.log("Initializing App...");
    // 1. Load Theme preference early
    loadTheme(); // Now safe to call as applyTheme checks elements


    // 2. Load Language preference & translations
    state.setCurrentLanguage(localStorage.getItem(LS_KEYS.LANGUAGE) || 'en');
    await setLanguage(state.currentLanguage); // Sets lang, loads translations, applies dir/font

    // 3. Fetch and process audio data
    try {
        console.log(`Fetching audio list from: ${DATA_JSON_URL}`);
        const response = await fetch(DATA_JSON_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} while fetching ${DATA_JSON_URL}`);
        }
        const audioFilenames = await response.json();

        processAudioData(audioFilenames); // Populates global 'pages' array

        if (pages.length > 0) {
            state.setTotalPages(pages.length);
            loadSettings(); // Load volume, mute, repeat, speed, last page index
            initializePlayerUI(); // Setup UI based on loaded data & settings
            setupEventListeners(); // Setup interactions AFTER UI is ready
            // loadTheme(); // Apply theme now that elements definitely exist - Already called above
            console.log("App Initialized Successfully with remote data.");
        } else {
            handleLoadError("Failed to process audio data. 'pages' array is empty.");
        }

    } catch (error) {
        handleLoadError(`Failed to load or process audio data: ${error}`);
    }
}

// Function to process fetched filenames into the pages array
function processAudioData(filenames) {
    const surahAudioBaseUrl = `${AUDIO_BASE_URL}/${RECITER_PATH}/${SURAH_PATH}`;
    // Use the module-scoped 'pages' variable
    pages = filenames.map((filename, index) => {
        const audioUrl = `${surahAudioBaseUrl}/${filename}`;
        const pageId = index + 1;
        return { id: pageId, audio: audioUrl, cover: DEFAULT_COVER_IMAGE };
    });
    console.log("Processed pages data:", pages.length, "pages");
}


function handleLoadError(message) {
    console.error(message);
    if (dom.pageTitle) dom.pageTitle.textContent = "Error";
    if (dom.surahReciter) dom.surahReciter.textContent = "Could not load audio data.";
    if (dom.libraryList) dom.libraryList.innerHTML = `<p class="p-2 text-lg text-red-500">${state.translations?.loadingError || 'Failed to load pages.'}</p>`;
    dom.bodyEl?.classList.add('app-error');
}

function initializePlayerUI() {
    populateLibrary(); // Build library list using current translations and module 'pages'
    // Load initial page data based on loaded index, don't play. Pass the 'pages' array explicitly.
    if (pages && pages.length > state.currentPageIndex) {
         player.loadPage(state.currentPageIndex, pages, false); // Pass 'pages' here
    } else {
        console.error("Cannot load initial page, 'pages' data missing or index out of bounds.");
        handleLoadError("Initial page data unavailable.")
    }
    updateVolumeFill();
    updateSpeedFill();
    updateRepeatButtonUI();
}

// --- Event Handlers ---
function handleProgressScrub() {
     if (dom.audio && dom.audio.duration && isFinite(dom.audio.duration) && dom.progressBar) {
         dom.audio.currentTime = dom.progressBar.value;
         if (dom.progressBarFill) dom.progressBarFill.style.width = `${(dom.audio.currentTime / dom.audio.duration) * 100}%`;
     }
}
function handleVolumeScrub() {
    if (!dom.volumeSlider || !dom.audio) return;
    let newVolume = parseFloat(dom.volumeSlider.value) / 100;
    dom.audio.volume = newVolume;
    let newMutedState = newVolume === 0;
    let volumeToSave = state.previousVolume; // Default

    if (newMutedState !== state.isMuted) { // Mute state changed via slider
        state.setIsMuted(newMutedState);
        saveMutedState(state.isMuted);
    }
    if (!state.isMuted) { // Only update previousVolume and save if not muted
        state.setPreviousVolume(newVolume);
        volumeToSave = newVolume; // Save the current volume
        saveVolume(volumeToSave);
    } else { // If slider muted, save the volume *before* it hit zero
        saveVolume(state.previousVolume);
    }
    updateVolumeIcon(state.isMuted, newVolume);
    updateVolumeFill();
}
function handleMuteToggle() {
    state.setIsMuted(!state.isMuted); // Toggle state first
    if (state.isMuted) {
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
    saveMutedState(state.isMuted);
    saveVolume(state.isMuted ? state.previousVolume : dom.audio.volume);
}
function handleSpeedScrub() {
    if (!dom.speedSlider || !dom.audio) return;
    state.setCurrentSpeed(parseFloat(dom.speedSlider.value));
    dom.audio.playbackRate = state.currentSpeed;
    updateSpeedFill();
    updateSpeedDisplay(state.currentSpeed);
    saveSpeed(state.currentSpeed);
}
async function handleLanguageChange(event) {
     const newLang = event.target.value;
     await setLanguage(newLang);
     populateLibrary(); // Repopulate library after language changes
     updateSpeedDisplay(state.currentSpeed); // Update potentially translated text
     updateRepeatButtonUITitle();
     updatePageBadge();
}

// --- Setup Event Listeners ---
function setupEventListeners() {
    console.log("Setting up event listeners...");
    // Null check elements before adding listeners
    // Pass the module-scoped 'pages' array to handlers that need it
    dom.playPauseButton?.addEventListener('click', () => player.togglePlayPause(pages));
    dom.forwardButton?.addEventListener('click', () => player.nextPage(pages));
    dom.backwardButton?.addEventListener('click', () => player.prevPage(pages));
    dom.repeatButton?.addEventListener('click', toggleRepeat); // toggleRepeat is defined locally

    dom.audio?.addEventListener('timeupdate', player.handleAudioTimeUpdate);
    dom.audio?.addEventListener('loadedmetadata', player.handleAudioLoadedMetadata);
    // Pass 'pages' to ended handler setup
    dom.audio?.addEventListener('ended', () => player.handleAudioEnded(pages));
    dom.audio?.addEventListener('canplay', player.handleAudioCanPlay);
    dom.audio?.addEventListener('error', player.handleAudioError);
    dom.audio?.addEventListener('stalled', player.handleAudioStalled);
    dom.audio?.addEventListener('waiting', player.handleAudioWaiting);
    dom.audio?.addEventListener('playing', player.handleAudioPlaying);
    dom.audio?.addEventListener('pause', player.handleAudioPause);

    dom.progressBar?.addEventListener('input', handleProgressScrub);
    dom.volumeSlider?.addEventListener('input', handleVolumeScrub);
    dom.volumeMuteButton?.addEventListener('click', handleMuteToggle);
    dom.speedSlider?.addEventListener('input', handleSpeedScrub);
    dom.libraryLink?.addEventListener('click', openLibrary);
    dom.closeLibraryButton?.addEventListener('click', closeLibrary);
    dom.libraryOverlay?.addEventListener('click', closeLibrary);
    // Use toggleTheme defined in this file
    dom.themeToggleButton?.addEventListener('click', toggleTheme);
    dom.languageSwitcher?.addEventListener('change', handleLanguageChange);

    // System theme listener
    const pds = window.matchMedia?.('(prefers-color-scheme: dark)');
    // Use applyTheme defined in this file
    pds?.addEventListener('change', (e) => { if (!localStorage.getItem(LS_KEYS.THEME)) applyTheme(e.matches ? 'dark' : 'light'); });
    console.log("Event listeners set up.");
}

// --- Repeat Toggle --- (Defined only ONCE here)
function toggleRepeat() {
    state.setRepeatMode((state.repeatMode + 1) % 3);
    updateRepeatButtonUI(); // Update the button's look
    saveRepeatMode(state.repeatMode); // Save the new mode
}

// --- Start ---
initializeApp();