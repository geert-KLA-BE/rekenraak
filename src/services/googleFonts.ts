// Lazily injects a Google Fonts stylesheet <link> the first time an online font is
// selected. Distinct from the bundled @fontsource fonts (index.css), which work fully
// offline — these need an internet connection to render correctly at print/preview time,
// and silently fall back to the CSS stack's next generic family (see fontOptions.ts) if
// the request fails or the machine is offline.
const loadedFamilies = new Set<string>();

// `googleFamily` is the Google Fonts API v2 family query, e.g. "Roboto:wght@400;700".
export function ensureGoogleFontLoaded(googleFamily: string): void {
    if (loadedFamilies.has(googleFamily)) return;
    loadedFamilies.add(googleFamily);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFamily)}&display=swap`;
    document.head.appendChild(link);
}
