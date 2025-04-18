// js/audio.js
import * as dom from './dom.js';
import * as state from './state.js';
// Import general UI updaters
import * as ui from './ui.js';
// Import specific library UI updater
import { updateLibrarySelection } from './library.js'; // ***** CORRECT IMPORT *****
// Import settings saver
import { saveLastPageIndex } from './settings.js';
// Import i18n function
import { applyTranslations } from './i18n.js';

// Declare global 'pages' from data.js
/* global pages */

// --- Core Audio Actions ---

export function loadPage(index, playWhenReady = false) {
    if (index < 0 || index >= state.totalPagesInLibrary || typeof pages === 'undefined' || !pages[index]) {
        console.error("Invalid page index or data for loadPage:", index);
        return;
    }
    const page = pages[index];
    state.setCurrentPageIndex(index);

    ui.updatePlayerInfo(page); // Update cover
    applyTranslations(); // Update title, reciter, badge AFTER index is set

    if(dom.audio) {
        dom.audio.src = page.audio;
        dom.audio.load();
    } else {
        console.error("Audio element not found!");
        return;
    }

    ui.resetProgressUI();
    updateLibrarySelection(); // ***** CALL DIRECTLY *****
    saveLastPageIndex(index);

    state.setIsPlaying(playWhenReady);
    if (!playWhenReady) {
        if (dom.audio && !dom.audio.paused) dom.audio.pause();
        ui.updatePlayPauseButton(false);
    } else {
        ui.updatePlayPauseButton(true); // Optimistic update
    }
}

// Helper function combines loading and playing
export function loadPageAndPlay(index) {
    loadPage(index, true);
}


export function playAudio() {
    if (!dom.audio || !dom.audio.src || dom.audio.src === window.location.href) {
        console.warn("Audio source invalid or not ready. Cannot play.");
        if (state.totalPagesInLibrary > 0) loadPage(state.currentPageIndex, true);
        return;
    }

    const playPromise = dom.audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            state.setIsPlaying(true);
            ui.updatePlayPauseButton(true);
            updateLibrarySelection(); // ***** CALL DIRECTLY *****
        }).catch(error => {
            console.error("Audio playback failed:", error);
            state.setIsPlaying(false);
            ui.updatePlayPauseButton(false);
            updateLibrarySelection(); // ***** CALL DIRECTLY *****
        });
    } else { // Fallback for older browsers
        state.setIsPlaying(true);
        ui.updatePlayPauseButton(true);
        updateLibrarySelection(); // ***** CALL DIRECTLY *****
    }
}

export function pauseAudio() {
    if(dom.audio) dom.audio.pause();
    state.setIsPlaying(false);
    ui.updatePlayPauseButton(false);
    updateLibrarySelection(); // ***** CALL DIRECTLY *****
}

export function togglePlayPause() {
    if (state.isPlaying) {
        pauseAudio();
    } else {
        if (dom.audio && dom.audio.readyState >= 2) {
            playAudio();
        } else {
            console.warn("Audio not ready to play. State:", dom.audio?.readyState);
            if (state.totalPagesInLibrary > 0) {
                loadPage(state.currentPageIndex, true);
            }
        }
    }
}

// --- Navigation ---
export function nextPage() {
    const nextIndex = (state.currentPageIndex + 1) % state.totalPagesInLibrary;
    loadPage(nextIndex, state.isPlaying);
}

export function prevPage() {
    const prevIndex = (state.currentPageIndex - 1 + state.totalPagesInLibrary) % state.totalPagesInLibrary;
    loadPage(prevIndex, state.isPlaying);
}

// --- Event Handlers for Audio Element ---
export function handleAudioTimeUpdate() {
    if(dom.audio) {
        ui.updateProgressUI(dom.audio.currentTime, dom.audio.duration);
    }
}

export function handleAudioLoadedMetadata() {
     if(dom.audio) {
        ui.updateProgressUI(dom.audio.currentTime, dom.audio.duration);
         if (state.isPlaying && dom.audio.paused) {
             playAudio();
         }
     }
}

export function handleAudioCanPlay() {
    console.log("Audio can play.");
    if (state.isPlaying && dom.audio && dom.audio.paused) {
        playAudio();
    }
}

export function handleAudioEnded() {
    console.log("Audio ended. Repeat mode:", state.repeatMode);
    const nextIndex = (state.repeatMode === REPEAT_PAGE)
        ? state.currentPageIndex
        : (state.currentPageIndex + 1) % state.totalPagesInLibrary;

    if (state.repeatMode === REPEAT_OFF && nextIndex === 0 && state.currentPageIndex === state.totalPagesInLibrary - 1) {
        loadPage(nextIndex, false);
    } else {
        loadPage(nextIndex, true);
    }
}

export function handleAudioError(e) {
    console.error("Audio playback error:", e);
    pauseAudio();
}

export function handleAudioStalled() {
    console.warn("Audio playback stalled.");
}

export function handleAudioWaiting() {
     console.log("Audio playback waiting (buffering).");
}

export function handleAudioPlaying() {
     console.log("Audio playback started/resumed.");
      if (!state.isPlaying) { // Sync state if needed
          state.setIsPlaying(true);
          ui.updatePlayPauseButton(true);
          updateLibrarySelection(); // ***** CALL DIRECTLY *****
      }
}

export function handleAudioPause() {
     console.log("Audio paused.");
      if (state.isPlaying && dom.audio && !dom.audio.ended) { // Sync state if external pause
          pauseAudio();
      }
}