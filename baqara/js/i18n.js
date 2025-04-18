// js/i18n.js
import * as dom from './dom.js';
import * as state from './state.js';
import { updateRepeatButtonUITitle, updatePageBadge } from './ui.js';
import { LS_KEYS } from './constants.js';

/* global pages */

export async function loadTranslations(lang) {
    try {
        const response = await fetch(`lang/${lang}.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.setTranslations(await response.json());
        console.log(`Translations loaded: ${lang}`);
    } catch (error) {
        console.error(`Load translations error (${lang}):`, error);
        if (lang !== 'en') { console.warn(`Falling back to English translations.`); await loadTranslations('en'); }
        else { console.error("Failed to load English fallback translations."); state.setTranslations({}); }
    }
}

export function applyTranslations() {
    if (!state.translations || Object.keys(state.translations).length === 0) { console.warn("ApplyTranslations called, but no translations are loaded."); return; }
    const translatedSurahName = state.translations.surahName || "Surah";
    const translatedReciterName = state.translations.reciterName || "Reciter";

    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.dataset.translateKey;
        let translation = state.translations[key];
        if (translation) {
            if (key === 'pageTitle' && state.totalPagesInLibrary > 0 && typeof pages !== 'undefined' && pages[state.currentPageIndex]) { translation = translation.replace('{pageNumber}', pages[state.currentPageIndex].id); }
            else if (key === 'surahReciter') { translation = translation.replace('{surahName}', translatedSurahName).replace('{reciterName}', translatedReciterName); }
            else if (key === 'playbackSpeedValue') { translation = translation.replace('{speed}', state.currentSpeed.toFixed(2)); }

            if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && element.placeholder) { element.placeholder = translation; }
            else if (element.hasAttribute('title') && element.id !== 'repeat') { element.title = translation; }
            // Removed specific check for repeat button span as it's no longer there
            else if (element.id !== 'repeat' && !element.querySelector('[data-translate-key]')) { element.textContent = translation; }
        }
    });
    if (state.translations.appName && document.title !== state.translations.appName) { document.title = state.translations.appName; }
    updateRepeatButtonUITitle();
    updatePageBadge();
}

export async function setLanguage(lang) {
    if (!lang) { console.warn("setLanguage called with null or empty language."); return; }
    state.setCurrentLanguage(lang);
    await loadTranslations(lang);

    dom.htmlEl.lang = lang;
    dom.htmlEl.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // Apply new fonts based on language
    dom.bodyEl.style.fontFamily = lang === 'ar'
        ? "'Tajawal', sans-serif" // Use Tajawal for Arabic
        : "'Andika', sans-serif"; // Use Andika for English/Others

    applyTranslations();
    // Library repopulation trigger should be in main.js after this resolves
    if (dom.languageSwitcher) { dom.languageSwitcher.value = lang; }
    localStorage.setItem(LS_KEYS.LANGUAGE, lang);
}