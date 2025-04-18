// js/utils.js

export function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || !isFinite(totalSeconds)) {
        return "--:--"; // Return placeholder if time is invalid
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    // Pad seconds with a leading zero if less than 10
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Add any other utility functions here if needed