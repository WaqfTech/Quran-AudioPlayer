// js/audio.js
import * as dom from './dom.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { updateLibrarySelection } from './library.js'; // Specific library UI update
import { saveLastPageIndex } from './settings.js';
import { applyTranslations } from './i18n.js';
import { REPEAT_OFF, REPEAT_PAGE } from './constants.js'; // Import constants

// --- Core Audio Actions ---

/**
 * Loads the specified page data into the player.
 * @param {number} index - The index of the page to load in the 'pages' array.
 * @param {Array} pages - The array containing all page data objects.
 * @param {boolean} [playWhenReady=false] - If true, attempt to play the audio once loaded.
 */
export function loadPage(index, pages, playWhenReady = false) {
    // Validate index against the passed 'pages' array length
    if (!pages || pages.length === 0 || index < 0 || index >= pages.length || !pages[index]) {
        console.error("Invalid page index or data for loadPage:", index, pages?.length);
        return; // Stop if data is invalid
    }
    const page = pages[index]; // Get page data from the passed array
    state.setCurrentPageIndex(index); // Update global state

    ui.updatePlayerInfo(page); // Update cover image etc.
    applyTranslations(); // Updates title, reciter, page badge using current index

    if(dom.audio) {
        console.log(`Loading audio source: ${page.audio}`);
        dom.audio.src = page.audio; // Set the full audio URL
        dom.audio.load(); // Tell the browser to load the new source
    } else {
        console.error("Audio element not found!");
        return;
    }

    ui.resetProgressUI(); // Reset progress bars and times for new track
    updateLibrarySelection(); // Highlight the new page in the library
    saveLastPageIndex(index); // Persist the current page index

    // Set playback intent based on 'playWhenReady' flag
    state.setIsPlaying(playWhenReady);
    if (!playWhenReady) {
        // Ensure UI reflects stop state if not playing immediately
        if (dom.audio && !dom.audio.paused) {
            dom.audio.pause(); // Explicitly pause if needed
        }
        ui.updatePlayPauseButton(false);
    } else {
        // Optimistically update button, actual play triggered by events
        ui.updatePlayPauseButton(true);
    }
}

/**
 * Convenience function to load a page and immediately try to play it.
 * @param {number} index - The index of the page to load.
 * @param {Array} pages - The array containing all page data objects.
 */
export function loadPageAndPlay(index, pages) {
    loadPage(index, pages, true);
}

/**
 * Attempts to play the currently loaded audio. Updates UI state.
 */
export function playAudio() {
    if (!dom.audio || !dom.audio.src || dom.audio.src === window.location.href) {
        console.warn("Audio source invalid or not ready. Cannot play.");
        // Attempt to reload current page if data seems available
        if (state.totalPagesInLibrary > 0 && typeof pages !== 'undefined' && pages.length > 0) {
             loadPage(state.currentPageIndex, pages, true);
        }
        return;
    }

    console.log("Attempting to play...");
    const playPromise = dom.audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log("Playback started successfully.");
            state.setIsPlaying(true);
            ui.updatePlayPauseButton(true); // Update UI on successful play
            updateLibrarySelection(); // Update playing indicator in library
        }).catch(error => {
            console.error("Audio playback failed:", error);
            // Often fails due to user interaction requirement initially
            state.setIsPlaying(false);
            ui.updatePlayPauseButton(false); // Update UI on failure
            updateLibrarySelection();
        });
    } else { // Fallback for older browsers maybe? Unlikely needed.
        state.setIsPlaying(true);
        ui.updatePlayPauseButton(true);
        updateLibrarySelection();
    }
}

/**
 * Pauses the currently playing audio. Updates UI state.
 */
export function pauseAudio() {
    if(dom.audio) {
        dom.audio.pause();
        console.log("Audio paused via pauseAudio().");
    }
    state.setIsPlaying(false);
    ui.updatePlayPauseButton(false);
    updateLibrarySelection();
}

/**
 * Toggles between playing and pausing the audio.
 * If audio isn't ready, attempts to load the current page first.
 * @param {Array} pages - The array containing all page data objects (needed for potential reload).
 */
export function togglePlayPause(pages) {
    if (state.isPlaying) {
        pauseAudio();
    } else {
        // Check if audio is ready enough to play
        if (dom.audio && dom.audio.readyState >= 2) { // HAVE_CURRENT_DATA or more
            playAudio();
        } else {
            // Audio not ready, maybe load failed or is still loading
            console.warn("Audio not ready to play on toggle. State:", dom.audio?.readyState);
            // Attempt to reload the current page and play when ready
            if (state.totalPagesInLibrary > 0 && pages) { // Check if pages array was passed
                console.log(`Reloading page ${state.currentPageIndex} before playing.`);
                loadPage(state.currentPageIndex, pages, true); // Pass 'pages' and set intent to play
            } else {
                 console.error("Cannot reload page in togglePlayPause: 'pages' array not available or invalid state.");
            }
        }
    }
}

// --- Navigation ---

/**
 * Loads the next page in the sequence.
 * @param {Array} pages - The array containing all page data objects.
 */
export function nextPage(pages) {
    if (!pages || pages.length === 0) return;
    const nextIndex = (state.currentPageIndex + 1) % state.totalPagesInLibrary;
    loadPage(nextIndex, pages, state.isPlaying); // Keep current playing state
}

/**
 * Loads the previous page in the sequence.
 * @param {Array} pages - The array containing all page data objects.
 */
export function prevPage(pages) {
    if (!pages || pages.length === 0) return;
    const prevIndex = (state.currentPageIndex - 1 + state.totalPagesInLibrary) % state.totalPagesInLibrary;
    loadPage(prevIndex, pages, state.isPlaying); // Keep current playing state
}

// --- Event Handlers for Audio Element ---

/** Handles the 'timeupdate' event from the audio element. */
export function handleAudioTimeUpdate() {
    if(dom.audio) {
        ui.updateProgressUI(dom.audio.currentTime, dom.audio.duration);
    }
}

/** Handles the 'loadedmetadata' event from the audio element. */
export function handleAudioLoadedMetadata() {
     if(dom.audio) {
        console.log(`Metadata loaded. Duration: ${dom.audio.duration}`);
        ui.updateProgressUI(dom.audio.currentTime, dom.audio.duration); // Update duration display
        // If isPlaying was set true before metadata loaded, attempt play now
         if (state.isPlaying && dom.audio.paused) {
             playAudio();
         }
     }
}

/** Handles the 'canplay' event from the audio element. */
export function handleAudioCanPlay() {
    // Useful for starting playback after src change if isPlaying is true
    console.log("Audio can play.");
    if (state.isPlaying && dom.audio && dom.audio.paused) { // Check if it should be playing but isn't
        playAudio();
    }
}

/**
 * Handles the 'ended' event from the audio element. Determines next action based on repeat mode.
 * @param {Array} pages - The array containing all page data objects.
 */
export function handleAudioEnded(pages) {
    if (!pages || pages.length === 0) return; // Need pages data
    console.log("Audio ended. Repeat mode:", state.repeatMode);
    const nextIndex = (state.repeatMode === REPEAT_PAGE)
        ? state.currentPageIndex // Stay on the same page if repeating page
        : (state.currentPageIndex + 1) % state.totalPagesInLibrary; // Go to next page otherwise (looping if REPEAT_ALL)

    if (state.repeatMode === REPEAT_OFF && nextIndex === 0 && state.currentPageIndex === state.totalPagesInLibrary - 1) {
        // Case: Repeat is off AND we just finished the *last* track.
        console.log("End of playlist and repeat is off. Stopping.");
        loadPage(nextIndex, pages, false); // Load first page data, but set playWhenReady to false
    } else {
        // Case: Repeat Page is on OR Repeat All is on OR Repeat Off but not at the end.
        console.log(`Loading next page: ${nextIndex}`);
        loadPage(nextIndex, pages, true); // Load the determined page and play it
    }
}

/** Handles the 'error' event from the audio element. */
export function handleAudioError(e) {
    console.error("Audio playback error:", e, dom.audio?.error);
    pauseAudio(); // Update UI to paused state on error
    // TODO: Maybe display a user-friendly error message?
}

/** Handles the 'stalled' event from the audio element. */
export function handleAudioStalled() {
    console.warn("Audio playback stalled, possibly due to network issues.");
    // TODO: Maybe show a buffering/stalled indicator?
}

/** Handles the 'waiting' event from the audio element. */
export function handleAudioWaiting() {
     console.log("Audio playback waiting for data (buffering).");
     // TODO: Maybe show a buffering indicator?
}

/** Handles the 'playing' event from the audio element. */
export function handleAudioPlaying() {
     console.log("Audio playback started or resumed.");
      // Hide buffering indicator if shown
      if (!state.isPlaying) { // Sync state if playback starts unexpectedly
          console.log("Syncing state to playing because 'playing' event fired.");
          state.setIsPlaying(true);
          ui.updatePlayPauseButton(true);
          updateLibrarySelection();
      }
}

/** Handles the 'pause' event from the audio element. */
export function handleAudioPause() {
     console.log("Audio paused event fired.");
     // Sync state if pause happens unexpectedly (e.g. end of stream handled by 'ended', error, user action outside button)
     if (state.isPlaying && dom.audio && !dom.audio.ended) {
         console.log("Syncing state to paused because 'pause' event fired while isPlaying was true.");
         pauseAudio(); // Call our function to sync state and UI
     }
}