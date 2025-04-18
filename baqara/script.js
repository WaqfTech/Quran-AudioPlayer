// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const audio = document.getElementById('audio-player');
    const coverImage = document.getElementById('cover-image');
    const pageTitle = document.getElementById('page-title');
    const surahReciter = document.getElementById('surah-reciter');
    const progressBar = document.getElementById('progress-bar');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const repeatButton = document.getElementById('repeat');
    const repeatIcon = repeatButton ? repeatButton.querySelector('i') : null;
    const backwardButton = document.getElementById('backward');
    const playPauseButton = document.getElementById('play-pause');
    const playPauseIcon = playPauseButton ? playPauseButton.querySelector('i') : null;
    const forwardButton = document.getElementById('forward');
    const volumeMuteButton = document.getElementById('volume-mute');
    const volumeMuteIcon = volumeMuteButton ? volumeMuteButton.querySelector('i') : null;
    const volumeSlider = document.getElementById('volume-slider');
    const volumeBarFill = document.getElementById('volume-bar-fill');
    const libraryLink = document.getElementById('library-link');
    const libraryPanel = document.getElementById('library');
    const closeLibraryButton = document.getElementById('close-library');
    const libraryList = document.getElementById('library-list');
    const libraryOverlay = document.getElementById('library-overlay');
    const themeToggleButton = document.getElementById('theme-toggle');
    const themeToggleIcon = themeToggleButton ? themeToggleButton.querySelector('i') : null;
    const languageSwitcher = document.getElementById('language-switcher');
    const currentPageNumEl = document.getElementById('current-page-num');
    const pageBadgeEl = document.getElementById('current-page-badge');
    const speedSlider = document.getElementById('speed-slider');
    const speedBarFill = document.getElementById('speed-bar-fill');
    const speedValueDisplay = document.getElementById('playback-speed-value');

    // --- State Variables ---
    let currentPageIndex = 0;
    let isPlaying = false;
    let repeatMode = 0; // 0: Off, 1: Page, 2: All
    let isMuted = false;
    let previousVolume = 1;
    let currentLanguage = 'en';
    let translations = {};
    let totalPagesInLibrary = 0;
    let currentSpeed = 1.0;

    // --- Constants ---
    const REPEAT_OFF = 0; const REPEAT_PAGE = 1; const REPEAT_ALL = 2;
    const LS_PREFIX = 'quranPlayer_';
    const LS_KEYS = { LANGUAGE: LS_PREFIX + 'language', THEME: LS_PREFIX + 'theme', VOLUME: LS_PREFIX + 'volume', MUTED: LS_PREFIX + 'muted', REPEAT_MODE: LS_PREFIX + 'repeatMode', SPEED: LS_PREFIX + 'speed' };

    // --- Initialization ---
    async function initializeApp() {
        loadTheme();
        currentLanguage = localStorage.getItem(LS_KEYS.LANGUAGE) || 'en';
        await setLanguage(currentLanguage);

        if (typeof pages !== 'undefined' && pages.length > 0) {
            totalPagesInLibrary = pages.length;
            loadSettings();
            initializePlayer();
            setupEventListeners();
        } else { handleLoadError("Failed to initialize: 'pages' data not found."); }
    }
    function handleLoadError(message) { console.error(message); if (pageTitle) pageTitle.textContent = "Error"; if (surahReciter) surahReciter.textContent = "Could not load audio data."; if (libraryList) libraryList.innerHTML = `<p class="p-2 text-sm text-red-500">${translations?.loadingError || 'Failed to load pages.'}</p>`; }
    function initializePlayer() { populateLibrary(); loadPage(currentPageIndex, false); updateVolumeFill(); updateSpeedFill(); updateRepeatButtonUI(); /* Update UI after settings loaded */ }

    // --- Settings Persistence ---
    function loadSettings() {
        const storedVolume = parseFloat(localStorage.getItem(LS_KEYS.VOLUME)); const storedMuted = localStorage.getItem(LS_KEYS.MUTED) === 'true'; const defaultVolume = 0.8; let initialVolume = isNaN(storedVolume) ? defaultVolume : storedVolume;
        isMuted = storedMuted; audio.muted = isMuted;
        if (isMuted) { previousVolume = initialVolume; audio.volume = 0; if (volumeSlider) volumeSlider.value = 0; } else { audio.volume = initialVolume; previousVolume = initialVolume; if (volumeSlider) volumeSlider.value = initialVolume * 100; }
        updateVolumeIcon();
        const storedRepeat = parseInt(localStorage.getItem(LS_KEYS.REPEAT_MODE)); repeatMode = isNaN(storedRepeat) || storedRepeat < 0 || storedRepeat > 2 ? 0 : storedRepeat;
        const storedSpeed = parseFloat(localStorage.getItem(LS_KEYS.SPEED)); currentSpeed = isNaN(storedSpeed) || storedSpeed < 0.5 || storedSpeed > 2.0 ? 1.0 : storedSpeed;
        if (speedSlider) { speedSlider.value = currentSpeed; handleSpeedChange(false); } else { audio.playbackRate = currentSpeed; }
    }

    // --- i18n ---
    async function loadTranslations(lang) { try { const r = await fetch(`lang/${lang}.json?v=${Date.now()}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); translations = await r.json(); console.log(`Translations loaded: ${lang}`); } catch (e) { console.error(`Load translations error (${lang}):`, e); if (lang !== 'en') await loadTranslations('en'); else translations = {}; } }
    function applyTranslations() { if (!translations || Object.keys(translations).length === 0) return; document.querySelectorAll('[data-translate-key]').forEach(el => { const k = el.dataset.translateKey; let t = translations[k]; if (t) { if (k === 'pageTitle' && totalPagesInLibrary > 0 && pages[currentPageIndex]) t = t.replace('{pageNumber}', pages[currentPageIndex].id); else if (k === 'surahReciter' && typeof surahName !== 'undefined' && typeof reciterName !== 'undefined') t = t.replace('{surahName}', surahName).replace('{reciterName}', reciterName); else if (k === 'playbackSpeedValue') t = t.replace('{speed}', currentSpeed.toFixed(2)); if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.placeholder) el.placeholder = t; else if (el.hasAttribute('title') && el.id !== 'repeat') el.title = t; else if (el.parentElement?.id === 'repeat' && k === 'repeat') { /* Handled by structure now */ } else if (el.id !== 'repeat' && !el.querySelector('[data-translate-key]')) el.textContent = t; } }); if (translations.appName && document.title !== translations.appName) document.title = translations.appName; updateRepeatButtonUITitle(); updatePageBadge(); }
    function updateRepeatButtonUITitle() { let k = 'repeatOff'; if (repeatMode === REPEAT_PAGE) k = 'repeatPage'; else if (repeatMode === REPEAT_ALL) k = 'repeatAll'; if (repeatButton) repeatButton.title = translations[k] || k; }
    function updatePageBadge() { if (pageBadgeEl && totalPagesInLibrary > 0 && pages[currentPageIndex]) { const cp = pages[currentPageIndex].id; const pt = translations?.pageLabel || "Page"; const ot = translations?.ofLabel || "of"; pageBadgeEl.innerHTML = `${pt} <span id="current-page-num">${cp}</span> ${ot} ${totalPagesInLibrary}`; } else if (pageBadgeEl) pageBadgeEl.innerHTML = ''; }
    async function setLanguage(lang) { currentLanguage = lang; await loadTranslations(lang); htmlEl.lang = lang; htmlEl.dir = lang === 'ar' ? 'rtl' : 'ltr'; bodyEl.style.fontFamily = lang === 'ar' ? "'Amiri', 'Montserrat', sans-serif" : "'Montserrat', sans-serif"; applyTranslations(); populateLibrary(); if (languageSwitcher) languageSwitcher.value = lang; localStorage.setItem(LS_KEYS.LANGUAGE, lang); }

    // --- Theme ---
    function applyTheme(theme) { if (!themeToggleButton) return; htmlEl.classList.toggle('dark', theme === 'dark'); if (themeToggleIcon) themeToggleIcon.className = theme === 'dark' ? 'fas fa-moon text-sm' : 'fas fa-sun text-sm'; }
    function toggleTheme() { const nt = htmlEl.classList.contains('dark') ? 'light' : 'dark'; applyTheme(nt); localStorage.setItem(LS_KEYS.THEME, nt); }
    function loadTheme() { const st = localStorage.getItem(LS_KEYS.THEME); const sp = window.matchMedia?.('(prefers-color-scheme: dark)').matches; applyTheme(st || (sp ? 'dark' : 'light')); }

    // --- Library ---
    function populateLibrary() { if (!libraryList) return; libraryList.innerHTML = ''; const pl = translations?.pageLabel || 'Page'; if (totalPagesInLibrary === 0) { libraryList.innerHTML = `<p class="p-2 text-sm text-gray-500">${translations?.loadingLibrary || 'Loading...'}</p>`; return; } pages.forEach((p, i) => { const it = document.createElement('button'); it.className = `library-item w-full text-start ps-3 pe-2 py-2 rounded-md text-sm flex items-center space-x-3 rtl:space-x-reverse hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-400 transition-all duration-150 group relative overflow-hidden border-l-3 border-transparent`; it.dataset.index = i; it.setAttribute('role', 'menuitem'); it.innerHTML = `<span class="page-number w-6 text-center font-medium flex-shrink-0 transition-colors">${p.id}</span><span class="page-name truncate transition-colors">${pl} ${p.id}</span><i class="fas fa-circle text-xs text-pink-500 opacity-0 transition-opacity absolute end-2 playing-indicator"></i>`; it.addEventListener('click', () => { if (currentPageIndex !== i) loadPage(i, true); else togglePlayPause(); closeLibrary(); }); libraryList.appendChild(it); }); updateLibrarySelection(); }
    function updateLibrarySelection() { if (!libraryList) return; libraryList.querySelectorAll('.library-item').forEach(it => { const isSel = parseInt(it.dataset.index) === currentPageIndex; it.classList.toggle('selected', isSel); it.setAttribute('aria-current', isSel ? 'page' : 'false'); const ind = it.querySelector('.playing-indicator'); if (ind) ind.classList.toggle('opacity-100', isSel && isPlaying); }); }
    function openLibrary() { if (!libraryPanel || !libraryOverlay) return; libraryPanel.style.transform = 'translateX(0%)'; libraryPanel.classList.remove('-translate-x-full', 'translate-x-full'); libraryOverlay.classList.remove('hidden'); requestAnimationFrame(() => { libraryOverlay.classList.add('opacity-100'); libraryOverlay.classList.remove('opacity-0'); }); setTimeout(() => { const sel = libraryList?.querySelector(`.library-item.selected`); if (sel) sel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100); }
    function closeLibrary() { if (!libraryPanel || !libraryOverlay) return; const trans = htmlEl.dir === 'rtl' ? 'translateX(100%)' : 'translateX(-100%)'; libraryPanel.style.transform = trans; libraryOverlay.classList.remove('opacity-100'); libraryOverlay.classList.add('opacity-0'); libraryPanel.addEventListener('transitionend', () => libraryOverlay.classList.add('hidden'), { once: true }); }

    // --- Core Player ---
    function loadPage(index, playWhenReady = false) { if (index < 0 || index >= totalPagesInLibrary || !pages[index]) return; const page = pages[index]; currentPageIndex = index; if (coverImage) coverImage.src = page.cover || 'images/quran_cover_placeholder.jpg'; applyTranslations(); audio.src = page.audio; audio.load(); if (progressBar) { progressBar.value = 0; progressBar.max = 1; } if (progressBarFill) progressBarFill.style.width = '0%'; if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(0); if (durationDisplay) durationDisplay.textContent = formatTime(0); updateLibrarySelection(); isPlaying = playWhenReady; if (!playWhenReady) { if (!audio.paused) audio.pause(); if (playPauseButton) playPauseButton.classList.remove('pulse'); if (playPauseIcon) playPauseIcon.className = 'fas fa-play'; if (coverImage) coverImage.classList.remove('playing'); } }
    function playAudio() { if (!audio.src || audio.src === window.location.href) { if (totalPagesInLibrary > 0) loadPage(currentPageIndex, true); return; } audio.play().then(() => { isPlaying = true; if (playPauseIcon) playPauseIcon.className = 'fas fa-pause'; if (coverImage) coverImage.classList.add('playing'); if (playPauseButton) playPauseButton.classList.add('pulse'); updateLibrarySelection(); }).catch(e => { console.error("Audio playback failed:", e); isPlaying = false; if (playPauseIcon) playPauseIcon.className = 'fas fa-play'; if (coverImage) coverImage.classList.remove('playing'); if (playPauseButton) playPauseButton.classList.remove('pulse'); updateLibrarySelection(); }); }
    function pauseAudio() { audio.pause(); isPlaying = false; if (playPauseIcon) playPauseIcon.className = 'fas fa-play'; if (coverImage) coverImage.classList.remove('playing'); if (playPauseButton) playPauseButton.classList.remove('pulse'); updateLibrarySelection(); }
    function togglePlayPause() { if (isPlaying) pauseAudio(); else if (audio.readyState >= 2) playAudio(); else if (totalPagesInLibrary > 0) loadPage(currentPageIndex, true); }
    function getNextTrackIndex() { if (repeatMode === REPEAT_PAGE) return currentPageIndex; return (currentPageIndex + 1) % totalPagesInLibrary; }
    function handleAudioEnd() { const ni = getNextTrackIndex(); if (repeatMode === REPEAT_OFF && ni === 0 && currentPageIndex === totalPagesInLibrary - 1) loadPage(ni, false); else loadPage(ni, true); }
    function nextPage() { loadPage((currentPageIndex + 1) % totalPagesInLibrary, isPlaying); }
    function prevPage() { loadPage((currentPageIndex - 1 + totalPagesInLibrary) % totalPagesInLibrary, isPlaying); }

    // --- Repeat Control ---
    function toggleRepeat() { repeatMode = (repeatMode + 1) % 3; updateRepeatButtonUI(); localStorage.setItem(LS_KEYS.REPEAT_MODE, repeatMode.toString()); }
    function updateRepeatButtonUI() {
        if (!repeatButton || !repeatIcon) return;
        // Icon Selection (Using FA6 Icons)
        // fa-redo: Standard refresh/off
        // fa-repeat: Repeat single (like repeat-1)
        // fa-infinity: Repeat all (visually distinct loop)
        let icon = 'fa-redo'; // Default (Off)
        let stateClass = 'state-off';
        let titleKey = 'repeatOff';
        audio.loop = false; // Default

        if (repeatMode === REPEAT_PAGE) {
            icon = 'fa-repeat'; // Repeat single icon
            stateClass = 'state-page';
            audio.loop = true;
            titleKey = 'repeatPage';
        } else if (repeatMode === REPEAT_ALL) {
            icon = 'fa-infinity'; // Repeat all icon
            stateClass = 'state-all';
            // audio.loop remains false
            titleKey = 'repeatAll';
        }

        repeatIcon.className = `fas ${icon} w-5 h-5`; // Update icon class
        repeatButton.classList.remove('state-off', 'state-page', 'state-all');
        repeatButton.classList.add(stateClass); // Add current state class for styling
        updateRepeatButtonUITitle(); // Update tooltip
        console.log("Repeat mode set to:", repeatMode, "Native loop:", audio.loop);
    }


    // --- Speed Control ---
    function handleSpeedChange(saveSetting = true) { if (!speedSlider) return; currentSpeed = parseFloat(speedSlider.value); audio.playbackRate = currentSpeed; updateSpeedFill(); if (speedValueDisplay) { let st = translations?.playbackSpeedValue?.replace('{speed}', currentSpeed.toFixed(2)) || `${currentSpeed.toFixed(2)}x`; speedValueDisplay.textContent = st; } if (saveSetting) localStorage.setItem(LS_KEYS.SPEED, currentSpeed.toString()); console.log("Playback speed set to:", currentSpeed); }
    function updateSpeedFill() { if (!speedSlider || !speedBarFill) return; const min = parseFloat(speedSlider.min); const max = parseFloat(speedSlider.max); const val = parseFloat(speedSlider.value); const p = ((val - min) / (max - min)) * 100; speedBarFill.style.width = `${p}%`; }

    // --- Volume Control ---
    function handleVolumeChange(saveSetting = true) { if (!volumeSlider) return; let nv = parseFloat(volumeSlider.value) / 100; audio.volume = nv; isMuted = nv === 0; updateVolumeIcon(); updateVolumeFill(); if (!isMuted) { previousVolume = nv; if (saveSetting) localStorage.setItem(LS_KEYS.VOLUME, previousVolume.toString()); } else if (saveSetting) localStorage.setItem(LS_KEYS.VOLUME, previousVolume.toString()); if (saveSetting) localStorage.setItem(LS_KEYS.MUTED, isMuted.toString()); }
    function updateVolumeFill() { if (volumeBarFill && volumeSlider) volumeBarFill.style.width = `${volumeSlider.value}%`; }
    function toggleMute() { isMuted = !isMuted; if (isMuted) { previousVolume = audio.volume; audio.volume = 0; if (volumeSlider) volumeSlider.value = 0; } else { audio.volume = previousVolume === 0 ? 0.5 : previousVolume; if (volumeSlider) volumeSlider.value = audio.volume * 100; } updateVolumeIcon(); updateVolumeFill(); localStorage.setItem(LS_KEYS.MUTED, isMuted.toString()); if (!isMuted) localStorage.setItem(LS_KEYS.VOLUME, audio.volume.toString()); }
    function updateVolumeIcon() { if (!volumeMuteIcon) return; if (isMuted || audio.volume === 0) volumeMuteIcon.className = 'fas fa-volume-mute w-5 h-5'; else if (audio.volume < 0.5) volumeMuteIcon.className = 'fas fa-volume-down w-5 h-5'; else volumeMuteIcon.className = 'fas fa-volume-up w-5 h-5'; }

    // --- Event Handlers ---
    function handleTimeUpdate() { if (audio.duration && isFinite(audio.duration)) { const p = (audio.currentTime / audio.duration) * 100; if (progressBar) progressBar.value = audio.currentTime; if (progressBarFill) progressBarFill.style.width = `${p}%`; } if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audio.currentTime); }
    function handleLoadedMetadata() { if (audio.duration && isFinite(audio.duration)) { if (durationDisplay) durationDisplay.textContent = formatTime(audio.duration); if (progressBar) progressBar.max = audio.duration; } else { if (durationDisplay) durationDisplay.textContent = "--:--"; if (progressBar) progressBar.max = 1; } if (isPlaying && audio.paused) playAudio(); }
    function handleCanPlay() { if (isPlaying && audio.paused) playAudio(); }
    function handleProgressChange() { if (audio.duration && isFinite(audio.duration) && progressBar) { audio.currentTime = progressBar.value; if (progressBarFill) progressBarFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`; } }

    // --- Utility ---
    function formatTime(ts) { if (isNaN(ts) || !isFinite(ts)) return "--:--"; const m = Math.floor(ts / 60); const s = Math.floor(ts % 60); return `${m}:${s < 10 ? '0' : ''}${s}`; }

    // --- Setup Event Listeners ---
    function setupEventListeners() {
        playPauseButton?.addEventListener('click', togglePlayPause); forwardButton?.addEventListener('click', nextPage); backwardButton?.addEventListener('click', prevPage); repeatButton?.addEventListener('click', toggleRepeat);
        audio.addEventListener('timeupdate', handleTimeUpdate); audio.addEventListener('loadedmetadata', handleLoadedMetadata); audio.addEventListener('ended', handleAudioEnd); audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', (e) => { console.error("Audio Error:", e); pauseAudio(); }); audio.addEventListener('stalled', () => console.warn("Audio Stalled")); audio.addEventListener('waiting', () => console.log("Audio Waiting"));
        audio.addEventListener('playing', () => { if (!isPlaying) { isPlaying = true; updateLibrarySelection(); } }); audio.addEventListener('pause', () => { if (isPlaying && !audio.ended) pauseAudio(); });
        progressBar?.addEventListener('input', handleProgressChange);
        volumeSlider?.addEventListener('input', () => handleVolumeChange(true)); volumeMuteButton?.addEventListener('click', toggleMute);
        speedSlider?.addEventListener('input', () => handleSpeedChange(true));
        libraryLink?.addEventListener('click', openLibrary); closeLibraryButton?.addEventListener('click', closeLibrary); libraryOverlay?.addEventListener('click', closeLibrary);
        themeToggleButton?.addEventListener('click', toggleTheme); languageSwitcher?.addEventListener('change', (e) => setLanguage(e.target.value));
        const pds = window.matchMedia?.('(prefers-color-scheme: dark)'); pds?.addEventListener('change', (e) => { if (!localStorage.getItem(LS_KEYS.THEME)) applyTheme(e.matches ? 'dark' : 'light'); });
    }

    // --- Start ---
    initializeApp();

}); // End DOMContentLoaded