// js/ui.js
import * as dom from './dom.js';
import * as state from './state.js';
import { REPEAT_OFF, REPEAT_PAGE, REPEAT_ALL } from './constants.js';
import { formatTime } from './utils.js';

// --- Theme Updates ---
export function applyTheme(theme) {
    if (!dom.themeToggleButton) return;
    dom.htmlEl.classList.toggle('dark', theme === 'dark');
    if (dom.themeToggleIcon) dom.themeToggleIcon.className = theme === 'dark' ? 'fas fa-moon text-sm' : 'fas fa-sun text-sm';
}

// --- Player Info Updates ---
export function updatePlayerInfo(page) {
    if (!page) return;
    if (dom.coverImage) dom.coverImage.src = page.cover || 'images/quran_cover_placeholder.jpg';
    // Title and reciter are handled by applyTranslations
}

export function updatePageBadge() {
    if (dom.pageBadgeEl && state.totalPagesInLibrary > 0 && typeof pages !== 'undefined' && pages[state.currentPageIndex]) {
        const currentPage = pages[state.currentPageIndex].id;
        const pageText = state.translations?.pageLabel || "Page";
        const ofText = state.translations?.ofLabel || "of";
        dom.pageBadgeEl.innerHTML = `${pageText} <span id="current-page-num">${currentPage}</span> ${ofText} ${state.totalPagesInLibrary}`;
    } else if (dom.pageBadgeEl) {
        dom.pageBadgeEl.innerHTML = ''; // Clear if data invalid
    }
}

// --- Progress Bar Updates ---
export function updateProgressUI(currentTime, duration) {
    if (dom.progressBar && duration > 0 && isFinite(duration)) {
        dom.progressBar.value = currentTime;
        dom.progressBar.max = duration; // Ensure max is set correctly
        if (dom.progressBarFill) dom.progressBarFill.style.width = `${(currentTime / duration) * 100}%`;
    } else if (dom.progressBar) {
         dom.progressBar.value = currentTime;
         if (dom.progressBarFill) dom.progressBarFill.style.width = `0%`; // Reset fill if duration invalid
    }
     if (dom.currentTimeDisplay) dom.currentTimeDisplay.textContent = formatTime(currentTime);
     if (dom.durationDisplay) dom.durationDisplay.textContent = formatTime(duration); // Update duration here too
}
export function resetProgressUI() {
    if (dom.progressBar) dom.progressBar.value = 0;
    if (dom.progressBarFill) dom.progressBarFill.style.width = '0%';
    if (dom.currentTimeDisplay) dom.currentTimeDisplay.textContent = formatTime(0);
    if (dom.durationDisplay) dom.durationDisplay.textContent = formatTime(0);
}


// --- Play/Pause Button & Cover ---
export function updatePlayPauseButton(isPlaying) {
    if (dom.playPauseIcon) dom.playPauseIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    if (dom.coverImage) dom.coverImage.classList.toggle('playing', isPlaying);
    if (dom.playPauseButton) dom.playPauseButton.classList.toggle('pulse', isPlaying);
}


// --- Repeat Button ---
export function updateRepeatButtonUI() {
    if (!dom.repeatButton || !dom.repeatIcon) return;
    let icon = 'fa-redo'; let stateClass = 'state-off';
    dom.audio.loop = false; // Default

    if (state.repeatMode === REPEAT_PAGE) { icon = 'fa-repeat'; stateClass = 'state-page'; dom.audio.loop = true; }
    else if (state.repeatMode === REPEAT_ALL) { icon = 'fa-infinity'; stateClass = 'state-all'; }

    dom.repeatIcon.className = `fas ${icon} w-5 h-5`;
    dom.repeatButton.classList.remove('state-off', 'state-page', 'state-all');
    dom.repeatButton.classList.add(stateClass);
    updateRepeatButtonUITitle(); // Update tooltip
}
export function updateRepeatButtonUITitle() { // Also called by i18n
    let titleKey = 'repeatOff';
    if (state.repeatMode === REPEAT_PAGE) titleKey = 'repeatPage';
    else if (state.repeatMode === REPEAT_ALL) titleKey = 'repeatAll';
    if (dom.repeatButton) dom.repeatButton.title = state.translations[titleKey] || titleKey;
}

// --- Volume Control ---
export function updateVolumeIcon(isMuted, volume) { // Pass state explicitly
    if (!dom.volumeMuteIcon) return;
    let baseClass = ' w-6 h-6'; // Use size class from HTML
    if (isMuted || volume === 0) dom.volumeMuteIcon.className = 'fas fa-volume-mute' + baseClass;
    else if (volume < 0.5) dom.volumeMuteIcon.className = 'fas fa-volume-down' + baseClass;
    else dom.volumeMuteIcon.className = 'fas fa-volume-up' + baseClass;
}
export function updateVolumeFill() {
    if (dom.volumeBarFill && dom.volumeSlider) dom.volumeBarFill.style.width = `${dom.volumeSlider.value}%`;
}

// --- Speed Control ---
export function updateSpeedFill() {
    if (!dom.speedSlider || !dom.speedBarFill) return;
    const min = parseFloat(dom.speedSlider.min);
    const max = parseFloat(dom.speedSlider.max);
    const val = parseFloat(dom.speedSlider.value);
    const percent = ((val - min) / (max - min)) * 100;
    dom.speedBarFill.style.width = `${percent}%`;
}
export function updateSpeedDisplay(speed) {
    if (dom.speedValueDisplay) {
        let speedText = state.translations?.playbackSpeedValue?.replace('{speed}', speed.toFixed(2)) || `${speed.toFixed(2)}x`;
        dom.speedValueDisplay.textContent = speedText;
    }
}