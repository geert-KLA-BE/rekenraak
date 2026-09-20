import PopupSelect from '../ui/PopupSelect';
import { WarningCircle } from '@phosphor-icons/react';
import type { FontOption } from '../../config/fontOptions';

// Font-family PopupSelect + its own "needs internet" hint, shared by the cijfers/tekst
// pickers (Inspector's Opdrachten tab) and the koptekst/voettekst ones (RegionStyleFields)
// so the Google Fonts warning (services/googleFonts.ts) isn't duplicated per call site.
export default function FontFamilyPicker({ value, options, onChange, ariaLabel }: {
    value: string;
    options: FontOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
}) {
    const isOnline = !!options.find((f) => f.value === value)?.google;
    return (
        <>
            <PopupSelect
                value={value}
                options={options.map((f) => ({ value: f.value, label: f.label }))}
                onChange={onChange}
                ariaLabel={ariaLabel} />
            {isOnline && (
                <div style={{
                    display: 'flex', gap: 'var(--sp-2)', alignItems: 'flex-start', marginTop: '6px',
                    padding: '8px', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-soft)', color: 'var(--text-main)', fontSize: 'var(--text-xs)',
                }}>
                    <WarningCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: '1px', color: 'var(--accent)' }} />
                    <span>Dit lettertype wordt opgehaald via Google Fonts en vereist een internetverbinding.</span>
                </div>
            )}
        </>
    );
}
