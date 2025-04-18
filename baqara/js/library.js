// js/library.js
import * as dom from './dom.js';
import * as state from './state.js';
import { loadPageAndPlay, togglePlayPause } from './audio.js';

/* global pages */

export function populateLibrary() {
    if (!dom.libraryList) return;
    dom.libraryList.innerHTML = '';
    const pageLabel = state.translations?.pageLabel || 'Page';

    if (state.totalPagesInLibrary === 0 || typeof pages === 'undefined') {
        dom.libraryList.innerHTML = `<p class="p-2 text-lg text-gray-500 dark:text-gray-400">${state.translations?.loadingLibrary || 'Loading library...'}</p>`;
        return;
    }

    pages.forEach((page, index) => {
        const item = document.createElement('button');
        // **UPDATED CLASS LIST AGAIN:**
        item.className = `
            library-item w-full text-start ps-3 pe-2 py-2.5 rounded-md flex items-center
            space-x-3 rtl:space-x-reverse
            text-gray-800 dark:text-gray-200  /* <-- Brighter base dark text (was gray-100) */
            hover:bg-black/5 dark:hover:bg-white/10
            hover:text-black dark:hover:text-white
            focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-400
            transition-all duration-150 group relative overflow-hidden
            border-l-3 border-transparent text-lg
        `;
        item.dataset.index = index;
        item.setAttribute('role', 'menuitem');
        item.innerHTML = `
                <span class="page-number w-7 text-center font-medium flex-shrink-0 transition-colors text-purple-600 dark:text-pink-400/90 group-hover:text-purple-700 dark:group-hover:text-pink-300">${page.id}</span> <!-- Dark page number slightly less transparent -->
                <span class="page-name truncate transition-colors">${pageLabel} ${page.id}</span> <!-- Inherits main item color -->
                <i class="fas fa-circle text-xs text-pink-500 opacity-0 transition-opacity absolute end-2 playing-indicator"></i>
            `;
        item.addEventListener('click', () => { handleLibraryItemClick(index); });
        dom.libraryList.appendChild(item);
    });
    updateLibrarySelection();
}

function handleLibraryItemClick(index) {
    if (state.currentPageIndex !== index) {
        loadPageAndPlay(index);
    } else {
        togglePlayPause();
    }
    closeLibrary();
}

export function updateLibrarySelection() {
    if (!dom.libraryList) return;
    dom.libraryList.querySelectorAll('.library-item').forEach(item => {
        const isSelected = parseInt(item.dataset.index) === state.currentPageIndex;
        item.classList.toggle('selected', isSelected);
        item.setAttribute('aria-current', isSelected ? 'page' : 'false');

        // Ensure text color is correct when selected/deselected
        const pageNameSpan = item.querySelector('.page-name');
        if(pageNameSpan){
            if(isSelected){
                 // Apply gradient text (or specific color) via CSS's .selected rule
                 pageNameSpan.classList.add('selected-page-name'); // Add helper class if needed by CSS
            } else {
                 // Ensure it uses the base item color when not selected
                 pageNameSpan.classList.remove('selected-page-name');
                 // Base color is set on the parent `library-item` class list
            }
        }

        const indicator = item.querySelector('.playing-indicator');
        if (indicator) indicator.classList.toggle('opacity-100', isSelected && state.isPlaying);
    });
}


// --- Library Panel Open/Close ---
export function openLibrary() {
    if (!dom.libraryPanel || !dom.libraryOverlay) return;
    dom.libraryPanel.style.transform = 'translateX(0%)';
    dom.libraryPanel.classList.remove('-translate-x-full', 'translate-x-full');
    dom.libraryOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        dom.libraryOverlay.classList.add('opacity-100');
        dom.libraryOverlay.classList.remove('opacity-0');
    });
    setTimeout(() => {
        const selectedItem = dom.libraryList?.querySelector(`.library-item.selected`);
        if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

export function closeLibrary() {
    if (!dom.libraryPanel || !dom.libraryOverlay) return;
    const translation = dom.htmlEl.dir === 'rtl' ? 'translateX(100%)' : 'translateX(-100%)';
    dom.libraryPanel.style.transform = translation;
    dom.libraryOverlay.classList.remove('opacity-100');
    dom.libraryOverlay.classList.add('opacity-0');

    const onTransitionEnd = () => {
        dom.libraryOverlay.classList.add('hidden');
        dom.libraryPanel.style.transform = ''; // Reset inline style FIRST
        // THEN add the correct class for final state
        dom.libraryPanel.classList.add(dom.htmlEl.dir === 'rtl' ? 'translate-x-full' : '-translate-x-full');
        dom.libraryPanel.removeEventListener('transitionend', onTransitionEnd);
    };
    dom.libraryPanel.addEventListener('transitionend', onTransitionEnd, { once: true });
    // Fallback timeout remains useful
    setTimeout(() => { if (!dom.libraryOverlay.classList.contains('hidden')) { console.warn("Transitionend fallback triggered for closeLibrary."); onTransitionEnd(); } }, 600);
}