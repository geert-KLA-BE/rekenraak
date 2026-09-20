// Selectable document fonts. These are CSS font-family values, not bundled files: only
// Ubuntu (text) and Azeret Mono (math) ship with the app (offline-safe, @fontsource in
// index.css); the plain entries below rely on a font already installed on the teacher's
// own machine (the same "pick a font from a list" model as Word), silently falling back
// to the next name in the stack if it isn't. Entries with `google` are loaded live from
// the Google Fonts CDN (services/googleFonts.ts) the first time they're picked — these
// need an internet connection at print/preview time and are NOT self-hosted.
export interface FontOption {
    label: string;
    value: string; // CSS font-family value, fed onto --font-sheet-text / --font-sheet-math
    google?: string; // Google Fonts API v2 family query, e.g. "Roboto:wght@400;700"
}

// The words face (opdrachten, titel, koptekst/voettekst). No monospace constraint here.
export const TEXT_FONT_OPTIONS: FontOption[] = [
    { label: 'Ubuntu (standaard)', value: "'Ubuntu', system-ui, sans-serif" },
    { label: 'Arial', value: "Arial, 'Helvetica Neue', sans-serif" },
    { label: 'Calibri', value: "Calibri, 'Segoe UI', sans-serif" },
    { label: 'Verdana', value: "Verdana, Geneva, sans-serif" },
    { label: 'Tahoma', value: "Tahoma, Geneva, sans-serif" },
    { label: 'Segoe UI', value: "'Segoe UI', Tahoma, sans-serif" },
    { label: 'Kalinga', value: "Kalinga, 'Nirmala UI', sans-serif" },
    { label: 'Century Gothic', value: "'Century Gothic', 'URW Gothic', sans-serif" },
    { label: 'Comic Sans MS', value: "'Comic Sans MS', 'Comic Neue', cursive, sans-serif" },
    { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
    { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
    // Online (Google Fonts) — needs internet at print/preview time.
    { label: 'Roboto (online)', value: "'Roboto', sans-serif", google: 'Roboto:wght@400;700' },
    { label: 'Open Sans (online)', value: "'Open Sans', sans-serif", google: 'Open+Sans:wght@400;700' },
    { label: 'Lato (online)', value: "'Lato', sans-serif", google: 'Lato:wght@400;700' },
    { label: 'Montserrat (online)', value: "'Montserrat', sans-serif", google: 'Montserrat:wght@400;700' },
    { label: 'Nunito (online)', value: "'Nunito', sans-serif", google: 'Nunito:wght@400;700' },
    { label: 'Poppins (online)', value: "'Poppins', sans-serif", google: 'Poppins:wght@400;700' },
];

// The math/digits face. Kept monospace-only — column arithmetic (cijferen, staartdelingen)
// only lines up if every glyph shares the same advance; see CLAUDE.md.
export const MATH_FONT_OPTIONS: FontOption[] = [
    { label: 'Azeret Mono (standaard)', value: "'Azeret Mono', monospace" },
    { label: 'Consolas', value: "Consolas, 'Cascadia Mono', monospace" },
    { label: 'Courier New', value: "'Courier New', Courier, monospace" },
    { label: 'Lucida Console', value: "'Lucida Console', Monaco, monospace" },
    // Online (Google Fonts) — needs internet at print/preview time.
    { label: 'Roboto Mono (online)', value: "'Roboto Mono', monospace", google: 'Roboto+Mono:wght@400;700' },
    { label: 'JetBrains Mono (online)', value: "'JetBrains Mono', monospace", google: 'JetBrains+Mono:wght@400;700' },
    { label: 'Source Code Pro (online)', value: "'Source Code Pro', monospace", google: 'Source+Code+Pro:wght@400;700' },
    { label: 'IBM Plex Mono (online)', value: "'IBM Plex Mono', monospace", google: 'IBM+Plex+Mono:wght@400;700' },
];

