import type { MabStyle } from '../../services/math/types';

// Renders place-value blocks for one MAB exercise. Three visual conventions:
//   symbolic:   units = dot, tens = bar, hundreds = small outlined square,
//               thousands = stacked-square stamp. Compact textbook abbreviation.
//   mab-bw:     Dienes blocks — units = 1×1 cube, tens = 1×10 rod,
//               hundreds = 10×10 flat, thousands = 10×10×10 cube.
//   mab-color:  Same as mab-bw but coloured per place value (yellow/green/blue/red).

export type MabPlace = 'thousands' | 'hundreds' | 'tens' | 'units';

// The glyph geometry below stays written in px (a tens rod IS ten unit cubes wide), but it
// is emitted as the SVG viewBox and as `em` on the element, so the whole Dienes figure
// follows the teacher's Lettergrootte slider. 13pt (the --sheet-size-math default) = 17.33px,
// so at the default the em values reproduce today's pixels exactly.
// SYNC: MabViewer.tsx repeats these two lines and sets fontSize: var(--sheet-size-math)
// on the figure, so the table columns and the glyphs inside them scale together.
const PX_PER_EM_AT_DEFAULT = 17.33;
const em = (px: number): string => `${px / PX_PER_EM_AT_DEFAULT}em`;

interface ColumnProps {
    count: number;
    place: MabPlace;
    style: MabStyle;
    color?: string;
    squarePattern?: boolean;
}

// 'mab-color' palette per place (fill). Strokes stay black for readability.
const COLOR_FILL: Record<MabPlace, string> = {
    units:     '#fbbf24',  // amber/yellow
    tens:      '#22c55e',  // green
    hundreds:  '#3b82f6',  // blue
    thousands: '#ef4444',  // red
};

// Resolves the fill color for a Dienes glyph. Solution-tint (non-default color)
// always wins so tekenen-mode overlays read uniformly red.
function resolveFill(style: MabStyle, place: MabPlace, color: string): string {
    if (color !== '#000') return color;
    if (style === 'mab-color') return COLOR_FILL[place];
    return 'white';
}

export function MabPlaceColumn({ count, place, style, color = '#000', squarePattern = false }: ColumnProps) {
    if (count === 0) return null;
    if (squarePattern || place === 'units' || place === 'hundreds') {
        return <PatternedGrid count={count} maxRows={squarePattern || place === 'units' ? 2 : 3} place={place} style={style} color={color} squarePattern={squarePattern} />;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: em(2), width: '100%', height: '100%' }}>
            {Array.from({ length: count }, (_, index) => <Glyph key={index} place={place} style={style} color={color} squarePattern={false} />)}
        </div>
    );
}

function PatternedGrid({ count, maxRows, place, style, color, squarePattern }: {
    count: number; maxRows: number; place: MabPlace; style: MabStyle; color: string; squarePattern: boolean;
}) {
    const cols = Math.ceil(count / maxRows);
    const cells: React.ReactNode[] = [];
    for (let k = 0; k < cols; k++) {
        for (let r = 0; r < maxRows; r++) {
            const idx = k * maxRows + r;
            if (idx >= count) break;
            cells.push(
                <div key={`${k}-${r}`} style={{ gridColumn: k + 1, gridRow: r + 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: squarePattern && k > 0 && k % 2 === 0 ? em(3) : undefined }}>
                    <Glyph place={place} style={style} color={color} squarePattern={squarePattern} />
                </div>
            );
        }
    }
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, auto)`,
            gridTemplateRows: `repeat(${maxRows}, auto)`,
            columnGap: em(squarePattern ? 2 : 3),
            rowGap: em(place === 'units' ? 5 : 2),
            justifyContent: 'center',
            alignContent: 'end',
            height: '100%',
        }}>
            {cells}
        </div>
    );
}

function Glyph({ place, style, color, squarePattern }: { place: MabPlace; style: MabStyle; color: string; squarePattern: boolean }) {
    if (style === 'symbolic') {
        if (place === 'thousands') return <SymbolicThousands color={color} />;
        if (place === 'hundreds')  return <SymbolicHundreds color={color} />;
        if (place === 'tens')      return <SymbolicTens color={color} vertical={squarePattern} />;
        return <SymbolicUnits color={color} />;
    }
    const fill = resolveFill(style, place, color);
    if (place === 'thousands') return <RealisticThousands stroke={color} fill={fill} />;
    if (place === 'hundreds')  return <RealisticHundreds stroke={color} fill={fill} />;
    if (place === 'tens')      return <RealisticTens stroke={color} fill={fill} vertical={squarePattern} />;
    return <RealisticUnits stroke={color} fill={fill} />;
}

// ── Symbolic glyphs ──────────────────────────────────────────────────────────

function SymbolicUnits({ color }: { color: string }) {
    const r = 2.5;
    return (
        <svg width={em(r * 2)} height={em(r * 2)} viewBox={`0 0 ${r * 2} ${r * 2}`}>
            <circle cx={r} cy={r} r={r - 0.5} fill={color} />
        </svg>
    );
}

function SymbolicTens({ color, vertical }: { color: string; vertical: boolean }) {
    const W = vertical ? 3 : 22, H = vertical ? 22 : 3;
    return (
        <svg width={em(W)} height={em(H)} viewBox={`0 0 ${W} ${H}`}>
            <rect width={W} height={H} fill={color} />
        </svg>
    );
}

function SymbolicHundreds({ color }: { color: string }) {
    const SQ = 10;
    return (
        <svg width={em(SQ)} height={em(SQ)} viewBox={`0 0 ${SQ} ${SQ}`}>
            <rect x={1} y={1} width={SQ - 2} height={SQ - 2} stroke={color} strokeWidth={1} fill="none" />
        </svg>
    );
}

function SymbolicThousands({ color }: { color: string }) {
    const SQ = 10, GAP = 2;
    const total = SQ * 2 + GAP;
    return (
        <svg width={em(total)} height={em(total)} viewBox={`-1 -1 ${total + 2} ${total + 2}`}>
            <rect x={0} y={0} width={SQ} height={SQ} stroke={color} strokeWidth={1} fill="none" />
            <rect x={SQ + GAP} y={0} width={SQ} height={SQ} stroke={color} strokeWidth={1} fill="none" />
            <rect x={0} y={SQ + GAP} width={SQ} height={SQ} stroke={color} strokeWidth={1} fill="none" />
            <rect x={SQ + GAP} y={SQ + GAP} width={SQ} height={SQ} stroke={color} strokeWidth={1} fill="none" />
        </svg>
    );
}

// ── Realistic Dienes glyphs (used by both mab-bw and mab-color) ──────────────

const CELL = 6;            // unit cube / tens-rod cell
const HUNDREDS_SQ = 32;
const STROKE = 0.5;

function RealisticUnits({ stroke, fill }: { stroke: string; fill: string }) {
    return (
        <svg width={em(CELL)} height={em(CELL)} viewBox={`0 0 ${CELL} ${CELL}`}>
            <rect width={CELL} height={CELL} fill={fill} stroke={stroke} strokeWidth={STROKE} />
        </svg>
    );
}

function RealisticTens({ stroke, fill, vertical }: { stroke: string; fill: string; vertical: boolean }) {
    const rodCell = vertical ? CELL / 2 : CELL;
    const W = vertical ? CELL - 1 : rodCell * 10;
    const H = vertical ? rodCell * 10 : rodCell;
    const inset = vertical ? STROKE : 0;
    return (
        <svg width={em(W)} height={em(H)} viewBox={`0 0 ${W} ${H}`}>
            <rect x={inset} y={inset} width={W - 2 * inset} height={H - 2 * inset} fill={fill} stroke={stroke} strokeWidth={STROKE} />
            {Array.from({ length: 9 }).map((_, j) => (
                <line key={j} x1={vertical ? inset : (j + 1) * rodCell} y1={vertical ? (j + 1) * rodCell : 0}
                    x2={vertical ? W - inset : (j + 1) * rodCell} y2={vertical ? (j + 1) * rodCell : H} stroke={stroke} strokeWidth={STROKE} />
            ))}
        </svg>
    );
}

function RealisticHundreds({ stroke, fill }: { stroke: string; fill: string }) {
    const size = HUNDREDS_SQ;
    const inset = 1;
    return (
        <svg width={em(size)} height={em(size)} viewBox={`0 0 ${size} ${size}`}>
            <rect x={inset} y={inset} width={size - 2 * inset} height={size - 2 * inset} fill={fill} stroke={stroke} strokeWidth={STROKE} />
        </svg>
    );
}

function RealisticThousands({ stroke, fill }: { stroke: string; fill: string }) {
    const C = 3;
    const S = C * 10;
    const OFFSET = 4;
    const total = S + OFFSET;
    // Front face = 10x10 grid + isometric back face.
    return (
        <svg width={em(total + 2)} height={em(total + 2)} viewBox={`-1 -1 ${total + 2} ${total + 2}`}>
            <rect x={OFFSET} y={0} width={S} height={S} fill="none" stroke={stroke} strokeWidth={STROKE} />
            <line x1={0} y1={OFFSET} x2={OFFSET} y2={0} stroke={stroke} strokeWidth={STROKE} />
            <line x1={S} y1={OFFSET} x2={S + OFFSET} y2={0} stroke={stroke} strokeWidth={STROKE} />
            <line x1={S} y1={S + OFFSET} x2={S + OFFSET} y2={S} stroke={stroke} strokeWidth={STROKE} />
            <rect x={0} y={OFFSET} width={S} height={S} fill={fill} stroke={stroke} strokeWidth={STROKE} />
            {Array.from({ length: 9 }).map((_, j) => (
                <g key={j}>
                    <line x1={(j + 1) * C} y1={OFFSET} x2={(j + 1) * C} y2={S + OFFSET} stroke={stroke} strokeWidth={STROKE} />
                    <line x1={0} y1={OFFSET + (j + 1) * C} x2={S} y2={OFFSET + (j + 1) * C} stroke={stroke} strokeWidth={STROKE} />
                </g>
            ))}
        </svg>
    );
}
