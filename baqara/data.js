// data.js

// Base path for the audio files relative to index.html
const audioBasePath = 'audio/baqara/';

// REMOVED: const reciterName = 'Abdul Rashid Al-Sufi';
// REMOVED: const surahName = 'Surah Al-Baqarah';

// Generate page data (Mapping Player Page 1 -> S2-P2.mp3, etc.)
const totalPages = 48; // From P2 to P49
const pages = [];

for (let i = 0; i < totalPages; i++) {
    const filePageNumber = i + 2; // Files are named S2-P2, S2-P3, ...
    const playerPageNumber = i + 1; // Display as Page 1, Page 2, ...
    const fileName = `S2-P${filePageNumber}-عبد_الرشيد_الصوفي-حفص_عن_عاصم_الكوفي.mp3`;
    pages.push({
        id: playerPageNumber, // Use player-facing page number as ID
        // name: `Page ${playerPageNumber}`, // Name is now handled by i18n 'pageTitle' key
        // artist: reciterName, // Artist is now handled by i18n 'reciterName' key
        audio: audioBasePath + fileName,
        cover: 'images/quran_cover_placeholder.jpg', // Default cover
    });
}

// Make pages available globally (since it's loaded via <script>)
// If you switch data.js to a module, you'd export pages instead.
// window.pages = pages; // One way, or just rely on script order