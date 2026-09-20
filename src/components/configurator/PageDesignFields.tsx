import { useRef } from 'react';
import { UploadSimple, Trash } from '@phosphor-icons/react';
import { useWorksheetStore, type PageImage } from '../../store/useWorksheetStore';
import { PAGE_W_PX } from '../layout/PageSheet';

// Inspector's Blad › Afbeeldingen tab: the page's free-standing images (photos/logos,
// positioned by hand on the sheet). Font size/family live in the Koptekst/Opdrachten/
// Voettekst tabs. The page-design template library (save/apply/rename/delete) lives in
// the general menu — PageDesignsModal.tsx.

// Images are data URLs — there is no backend to host files, so they travel inside
// docSettings like every other sheet setting (autosave, share link, .rekenraak export).
function readImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error('Lezen van bestand mislukt.'));
        reader.readAsDataURL(file);
    });
}

// Above this, warn: a big data URL fills up localStorage fast and can push a share link
// past persistence.ts's MAX_SHARE_BYTES.
const IMAGE_WARN_BYTES = 2 * 1024 * 1024;

// A4 height at 96dpi (PageSheet.tsx / index.css); PAGE_W_PX is the matching width.
const PAGE_H_PX = 1123;
const NEW_IMAGE_W = 300;
const NEW_IMAGE_H = 200;

function newImageId(): string {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function PageDesignFields() {
    const docSettings = useWorksheetStore((s) => s.docSettings);
    const updateDocSettings = useWorksheetStore((s) => s.updateDocSettings);
    const inputRef = useRef<HTMLInputElement>(null);

    const images = docSettings.pageImages ?? [];
    const updateImage = (id: string, patch: Partial<PageImage>) => updateDocSettings({
        pageImages: images.map((img) => img.id === id ? { ...img, ...patch } : img),
    });
    const removeImage = (id: string) => updateDocSettings({ pageImages: images.filter((img) => img.id !== id) });

    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > IMAGE_WARN_BYTES) {
            const mb = (file.size / 1024 / 1024).toFixed(1);
            if (!window.confirm(`Deze afbeelding is ${mb} MB. Grote afbeeldingen vullen de opslagruimte van je browser en maken deel-links onbruikbaar. Toch gebruiken?`)) return;
        }
        try {
            const src = await readImageFile(file);
            const next: PageImage = {
                id: newImageId(),
                src,
                x: (PAGE_W_PX - NEW_IMAGE_W) / 2,
                y: (PAGE_H_PX - NEW_IMAGE_H) / 2,
                width: NEW_IMAGE_W,
                height: NEW_IMAGE_H,
                rotation: 0,
                opacity: 1,
                order: 'front',
            };
            updateDocSettings({ pageImages: [...images, next] });
        } catch {
            window.alert('Afbeelding laden mislukt.');
        }
    };

    return (
        <>
            <div style={S.card}>
                <h4 style={S.cardTitle}>Afbeeldingen</h4>
                <p style={S.hintText}>Sleep een afbeelding recht op het blad om ze te verplaatsen, de greep in de hoek om ze groter of kleiner te maken, en de greep erboven om ze te draaien. "Voor tekst" laat ze over de oefeningen heen vallen, "achter tekst" erachter.</p>
                <button type="button" style={S.uploadBtn} onClick={() => inputRef.current?.click()}>
                    <UploadSimple size={14} /> Afbeelding toevoegen…
                </button>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddImage} />

                {images.length > 0 && (
                    <ul style={S.designList}>
                        {images.map((img) => (
                            <li key={img.id} style={S.imageRow}>
                                <img src={img.src} alt="" style={S.imageThumb} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="seg-group">
                                        <button type="button" className="seg-btn" aria-pressed={img.order === 'back'} onClick={() => updateImage(img.id, { order: 'back' })}>Achter tekst</button>
                                        <button type="button" className="seg-btn" aria-pressed={img.order === 'front'} onClick={() => updateImage(img.id, { order: 'front' })}>Voor tekst</button>
                                    </div>
                                    <label style={{ ...S.label, marginTop: '6px', marginBottom: '2px' }}>Doorzichtigheid: {Math.round(img.opacity * 100)}%</label>
                                    <input type="range" min={10} max={100} step={5}
                                        value={Math.round(img.opacity * 100)}
                                        onChange={(e) => updateImage(img.id, { opacity: Number(e.target.value) / 100 })}
                                        style={S.range} />
                                </div>
                                <button type="button" style={S.removeBtn} onClick={() => removeImage(img.id)} aria-label="Afbeelding verwijderen" title="Afbeelding verwijderen">
                                    <Trash size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

const S = {
    card: { padding: '0 0 var(--sp-4)', borderBottom: '1px solid var(--separator)' } as React.CSSProperties,
    cardTitle: { color: 'var(--text-main)', margin: '0 0 var(--sp-3) 0', fontSize: 'var(--text-md)', fontWeight: 600, letterSpacing: '-0.01em' } as React.CSSProperties,
    label: { display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 'var(--sp-2)' } as React.CSSProperties,
    hintText: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 var(--sp-3)', lineHeight: 1.4 } as React.CSSProperties,
    range: { width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' } as React.CSSProperties,
    uploadBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--separator)', background: 'var(--bg-surface-2)', color: 'var(--text-main)', marginBottom: 'var(--sp-3)' } as React.CSSProperties,
    imageRow: { display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', padding: '8px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface-2)' } as React.CSSProperties,
    imageThumb: { width: '48px', height: '48px', objectFit: 'cover', border: '1px solid var(--separator)', borderRadius: 'var(--radius-xs)', background: '#fff', flexShrink: 0 } as React.CSSProperties,
    removeBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent', borderRadius: 'var(--radius-xs)', cursor: 'pointer', flexShrink: 0 } as React.CSSProperties,
    designList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' } as React.CSSProperties,
};

