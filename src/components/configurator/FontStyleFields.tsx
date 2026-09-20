import type { CSSProperties, ReactNode } from 'react';
import Switch from '../ui/Switch';
import { SwatchRow } from '../ui/Swatch';
import { PRINT_PALETTE, PRINT_FILLS } from '../../config/printPalette';
import FontFamilyPicker from './FontFamilyPicker';
import type { FontOption } from '../../config/fontOptions';

// Reusable font-style block: family, size, text/fill color, bold/italic/underline.
// Used by RegionStyleFields (header/titel/footer, each with exactly one family+size) and
// standalone by regions with their own bespoke size/family mechanism (oefeningen, which
// has separate cijfers/tekst pickers) by simply omitting the fontFamily/fontSize slots —
// only the color/fill/bold/italic/underline rows render then.
export interface FontFamilySlot {
    label: string;
    value: string;
    options: FontOption[];
    onChange: (value: string) => void;
}

export interface FontSizeSlot {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

interface Props {
    fontFamily?: FontFamilySlot;
    fontSize?: FontSizeSlot;
    color?: string;
    onColorChange: (value: string) => void;
    background?: string;
    onBackgroundChange: (value: string) => void;
    bold?: boolean;
    onBoldChange: (value: boolean) => void;
    italic?: boolean;
    onItalicChange: (value: boolean) => void;
    underline?: boolean;
    onUnderlineChange: (value: boolean) => void;
}

export default function FontStyleFields({
    fontFamily, fontSize, color, onColorChange, background, onBackgroundChange,
    bold, onBoldChange, italic, onItalicChange, underline, onUnderlineChange,
}: Props) {
    return (
        <>
            {fontSize && (
                <Field label={`${fontSize.label}: ${fontSize.value}px`}>
                    <input type="range" min={fontSize.min} max={fontSize.max} value={fontSize.value}
                        onChange={(e) => fontSize.onChange(Number(e.target.value))} style={range} />
                </Field>
            )}

            {fontFamily && (
                <Field label={fontFamily.label}>
                    <FontFamilyPicker value={fontFamily.value} options={fontFamily.options} onChange={fontFamily.onChange} ariaLabel={fontFamily.label} />
                </Field>
            )}

            <div style={rowStyle}>
                <span style={textStyle}>Vet</span>
                <Switch checked={!!bold} onChange={onBoldChange} aria-label="Vet" />
            </div>
            <div style={rowStyle}>
                <span style={textStyle}>Cursief</span>
                <Switch checked={!!italic} onChange={onItalicChange} aria-label="Cursief" />
            </div>
            <div style={rowStyle}>
                <span style={textStyle}>Onderstreept</span>
                <Switch checked={!!underline} onChange={onUnderlineChange} aria-label="Onderstreept" />
            </div>

            <Field label="Tekstkleur">
                <SwatchRow options={PRINT_PALETTE} value={color ?? '#000000'} onChange={onColorChange} />
            </Field>

            <Field label="Vulkleur">
                <SwatchRow options={PRINT_FILLS} value={background ?? ''} onChange={onBackgroundChange} />
            </Field>
        </>
    );
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 'var(--sp-2)' }}>{label}</label>
            {children}
        </div>
    );
}

const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' };
const textStyle: CSSProperties = { fontSize: 'var(--text-sm)', color: 'var(--text-main)' };
const range: CSSProperties = { width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' };
