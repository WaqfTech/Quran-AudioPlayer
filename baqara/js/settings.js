// js/settings.js
import * as dom from './dom.js';
import * as state from './state.js';
import { LS_KEYS, DEFAULT_VOLUME, DEFAULT_SPEED, MIN_SPEED, MAX_SPEED, REPEAT_OFF } from './constants.js';
import { updateVolumeIcon, updateSpeedFill } from './ui.js'; // Need UI updates after loading

export function loadSettings() {
    // --- Load Volume & Mute ---
    const storedVolume = parseFloat(localStorage.getItem(LS_KEYS.VOLUME));
    const storedMuted = localStorage.getItem(LS_KEYS.MUTED) === 'true';
    let initialVolume = isNaN(storedVolume) ? DEFAULT_VOLUME : storedVolume;

    state.setIsMuted(storedMuted);
    if (dom.audio) dom.audio.muted = state.isMuted; // Apply mute state

    if (state.isMuted) {
        state.setPreviousVolume(initialVolume); // Store the underlying volume
        if (dom.audio) dom.audio.volume = 0; // Ensure audio element volume is 0 if muted initially
        if (dom.volumeSlider) dom.volumeSlider.value = 0; // Set slider to 0 if muted
    } else {
        if (dom.audio) dom.audio.volume = initialVolume; // Apply volume
        state.setPreviousVolume(initialVolume);
        if (dom.volumeSlider) dom.volumeSlider.value = initialVolume * 100; // Sync slider
    }
    updateVolumeIcon(state.isMuted, initialVolume); // Update icon based on loaded state

    // --- Load Repeat Mode ---
    const storedRepeat = parseInt(localStorage.getItem(LS_KEYS.REPEAT_MODE));
    state.setRepeatMode(isNaN(storedRepeat) || storedRepeat < 0 || storedRepeat > 2 ? REPEAT_OFF : storedRepeat);
    // UI update for repeat button happens in initializePlayer after element is surely ready

    // --- Load Speed ---
    const storedSpeed = parseFloat(localStorage.getItem(LS_KEYS.SPEED));
    state.setCurrentSpeed(isNaN(storedSpeed) || storedSpeed < MIN_SPEED || storedSpeed > MAX_SPEED ? DEFAULT_SPEED : storedSpeed);
    if (dom.speedSlider) {
        dom.speedSlider.value = state.currentSpeed;
        if(dom.audio) dom.audio.playbackRate = state.currentSpeed; // Apply to audio element
        updateSpeedFill(); // Update visual fill
        // Display update happens via applyTranslations later
    } else if (dom.audio) {
        dom.audio.playbackRate = state.currentSpeed; // Apply even if slider DNE
    }

     // --- Load Last Page Index ---
     const storedIndex = parseInt(localStorage.getItem(LS_KEYS.LAST_PAGE_INDEX));
     // Validate against total pages later if needed
     state.setCurrentPageIndex(isNaN(storedIndex) || storedIndex < 0 ? 0 : storedIndex);

    console.log("Settings Loaded:", { volume: initialVolume, muted: state.isMuted, repeat: state.repeatMode, speed: state.currentSpeed, pageIndex: state.currentPageIndex });
}

// Individual save functions
export function saveVolume(volume) {
    localStorage.setItem(LS_KEYS.VOLUME, volume.toString());
}
export function saveMutedState(muted) {
    localStorage.setItem(LS_KEYS.MUTED, muted.toString());
}
export function saveRepeatMode(mode) {
    localStorage.setItem(LS_KEYS.REPEAT_MODE, mode.toString());
}
export function saveSpeed(speed) {
    localStorage.setItem(LS_KEYS.SPEED, speed.toString());
}
export function saveLastPageIndex(index) {
    localStorage.setItem(LS_KEYS.LAST_PAGE_INDEX, index.toString());
}