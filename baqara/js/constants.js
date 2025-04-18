// js/constants.js

export const REPEAT_OFF = 0;
export const REPEAT_PAGE = 1;
export const REPEAT_ALL = 2;

// Local Storage Keys
const LS_PREFIX = 'quranPlayer_';
export const LS_KEYS = {
    LANGUAGE: LS_PREFIX + 'language',
    THEME: LS_PREFIX + 'theme',
    VOLUME: LS_PREFIX + 'volume',
    MUTED: LS_PREFIX + 'muted',
    REPEAT_MODE: LS_PREFIX + 'repeatMode',
    SPEED: LS_PREFIX + 'speed',
    LAST_PAGE_INDEX: LS_PREFIX + 'lastPageIndex' // Store last played page index
};

// Default values
export const DEFAULT_VOLUME = 0.8;
export const DEFAULT_SPEED = 1.0;
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.0;