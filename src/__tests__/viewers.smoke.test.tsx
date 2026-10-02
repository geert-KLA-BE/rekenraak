// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { EXERCISE_UI } from '../config/exerciseUI';
import { REGISTRY } from '../config/exerciseRegistry';
import { BlockWidthProvider, FULL_BLOCK_WIDTH_PX } from '../components/viewer/BlockWidthContext';
import { makeBlock } from './helpers/makeBlock';
import { MabPlaceColumn, type MabPlace } from '../components/viewer/MabBlocksSVG';
import { generateMabExercises } from '../services/mab/mabGenerator';
import { MabAppearanceConfig } from '../components/configurator/plugins/MabConfig';
import { useWorksheetStore } from '../store/useWorksheetStore';

// Every viewer, with real generated data, at the three cell widths a block can occupy,
// with and without the solution overlay. Viewers read their column count from
// BlockWidthContext, so a viewer that hardcodes 681px only shows up at the narrow widths.
//
// The bar is deliberately low — it renders, it produces DOM, and React logs nothing. That
// is enough to catch the crashes and key/prop warnings that a manual click-through misses.

// Full width, half and quarter of it, matching the 6/3/2-unit cells minus gaps.
const WIDTHS = [FULL_BLOCK_WIDTH_PX, 315, 151];

const typeIds = Object.keys(EXERCISE_UI);

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    cleanup();
    consoleError.mockRestore();
});

test('every registry type has a UI row, and vice versa', () => {
    expect(Object.keys(EXERCISE_UI).sort()).toEqual(Object.keys(REGISTRY).sort());
});

describe.each(['thousands', 'hundreds', 'tens', 'units'] as MabPlace[])('%s square patterns', (place) => {
    test.each(Array.from({ length: 9 }, (_, index) => index + 1))('%i blocks fill two rows, left to right', (count) => {
        const { container } = render(<MabPlaceColumn count={count} place={place} style="mab-bw" squarePattern />);
        const grid = container.firstElementChild as HTMLElement;
        const cells = Array.from(grid.children) as HTMLElement[];
        expect(grid.style.gridTemplateRows).toBe('repeat(2, auto)');
        expect(grid.style.gridTemplateColumns).toBe(`repeat(${Math.ceil(count / 2)}, auto)`);
        expect(cells.map(cell => [cell.style.gridColumn, cell.style.gridRow])).toEqual(
            Array.from({ length: count }, (_, index) => [String(Math.floor(index / 2) + 1), String(index % 2 + 1)]),
        );
    });
});

test('recognition patterns separate groups of four without changing drawing-mode spacing', () => {
    for (const count of [4, 5, 8, 9]) {
        const { container } = render(<MabPlaceColumn count={count} place="hundreds" style="mab-bw" squarePattern />);
        const grid = container.firstElementChild as HTMLElement;
        const cells = Array.from(grid.children) as HTMLElement[];
        expect(grid.style.columnGap).toBe(`${2 / 17.33}em`);
        expect(cells.map(cell => cell.style.marginLeft)).toEqual(
            Array.from({ length: count }, (_, index) => Math.floor(index / 2) > 0 && Math.floor(index / 2) % 2 === 0
                ? `${3 / 17.33}em` : ''),
        );
    }
    const { container } = render(<MabPlaceColumn count={9} place="hundreds" style="mab-bw" />);
    expect((container.firstElementChild as HTMLElement).style.columnGap).toBe(`${3 / 17.33}em`);
    expect(Array.from(container.firstElementChild!.children).every(cell => !(cell as HTMLElement).style.marginLeft)).toBe(true);
});

test('color MAB assigns red to D and blue to H', () => {
    for (const [place, fill] of [['thousands', '#ef4444'], ['hundreds', '#3b82f6']] as const) {
        const { container } = render(<MabPlaceColumn count={1} place={place} style="mab-color" squarePattern />);
        expect(container.querySelector('svg rect[fill]:not([fill="none"])')?.getAttribute('fill')).toBe(fill);
    }
});

test('color MAB H plates are larger than upright T rods', () => {
    const { container: hundreds } = render(<MabPlaceColumn count={4} place="hundreds" style="mab-color" squarePattern />);
    const { container: tens } = render(<MabPlaceColumn count={4} place="tens" style="mab-color" squarePattern />);
    const plate = hundreds.querySelector('svg')!;
    const rod = tens.querySelector('svg')!;
    expect(Number.parseFloat(plate.getAttribute('width')!)).toBeGreaterThan(Number.parseFloat(rod.getAttribute('width')!));
    expect(Number.parseFloat(plate.getAttribute('height')!)).toBeGreaterThan(Number.parseFloat(rod.getAttribute('height')!));
});

test.each(['mab-bw', 'mab-color'] as const)('%s D front is the same size as H', (style) => {
    const { container: hundreds } = render(<MabPlaceColumn count={1} place="hundreds" style={style} squarePattern />);
    const h = hundreds.querySelector('svg')!;
    const hFace = h.querySelector('rect')!;
    const hWidth = Number(hFace.getAttribute('width')) * Number.parseFloat(h.getAttribute('width')!) / h.viewBox.baseVal.width;
    for (const squarePattern of [false, true]) {
        const { container: thousands } = render(<MabPlaceColumn count={1} place="thousands" style={style} squarePattern={squarePattern} />);
        const d = thousands.querySelector('svg')!;
        const dFace = d.querySelector('rect[fill]:not([fill="none"])')!;
        const dWidth = Number(dFace.getAttribute('width')) * Number.parseFloat(d.getAttribute('width')!) / d.viewBox.baseVal.width;
        expect(dWidth).toBeCloseTo(hWidth);
    }
});

test('color MAB E squares have visible separation in the two-row pattern', () => {
    const { container } = render(<MabPlaceColumn count={2} place="units" style="mab-color" squarePattern />);
    const grid = container.firstElementChild as HTMLElement;
    expect(Number.parseFloat(grid.style.rowGap)).toBeGreaterThanOrEqual(5 / 17.33);
});

test.each(['symbolic', 'mab-bw'] as const)('%s hundreds outline stays inside its SVG viewport', (style) => {
    const { container } = render(<MabPlaceColumn count={1} place="hundreds" style={style} squarePattern />);
    const svg = container.querySelector('svg')!;
    const rect = svg.querySelector('rect')!;
    const size = Number(svg.viewBox.baseVal.width);
    const inset = Number(rect.getAttribute('x') || 0);
    const stroke = Number(rect.getAttribute('stroke-width'));
    expect(inset - stroke / 2).toBeGreaterThanOrEqual(0.5);
    expect(inset + Number(rect.getAttribute('width')) + stroke / 2).toBeLessThanOrEqual(size - 0.5);
});

test.each(['symbolic', 'mab-bw', 'mab-color'] as const)('%s thousands outlines stay inside their SVG viewport', (style) => {
    const { container } = render(<MabPlaceColumn count={9} place="thousands" style={style} squarePattern />);
    for (const svg of container.querySelectorAll('svg')) {
        const box = svg.viewBox.baseVal;
        for (const rect of svg.querySelectorAll('rect')) {
            const stroke = Number(rect.getAttribute('stroke-width')) / 2;
            expect(Number(rect.getAttribute('x') || 0) - stroke).toBeGreaterThanOrEqual(box.x + 0.5);
            expect(Number(rect.getAttribute('y') || 0) - stroke).toBeGreaterThanOrEqual(box.y + 0.5);
            expect(Number(rect.getAttribute('x') || 0) + Number(rect.getAttribute('width')) + stroke).toBeLessThanOrEqual(box.x + box.width - 0.5);
            expect(Number(rect.getAttribute('y') || 0) + Number(rect.getAttribute('height')) + stroke).toBeLessThanOrEqual(box.y + box.height - 0.5);
        }
    }
});

test('symbolic units sit fully inside their SVG viewport', () => {
    const { container } = render(<MabPlaceColumn count={7} place="units" style="symbolic" squarePattern />);
    for (const svg of container.querySelectorAll('svg')) {
        const circle = svg.querySelector('circle')!;
        const radius = Number(circle.getAttribute('r'));
        const cx = Number(circle.getAttribute('cx'));
        const cy = Number(circle.getAttribute('cy'));
        expect(cx - radius).toBeGreaterThanOrEqual(0.5);
        expect(cy - radius).toBeGreaterThanOrEqual(0.5);
        expect(Number(svg.viewBox.baseVal.width) - cx - radius).toBeGreaterThanOrEqual(0.5);
        expect(Number(svg.viewBox.baseVal.height) - cy - radius).toBeGreaterThanOrEqual(0.5);
    }
});

test.each(['symbolic', 'mab-bw', 'mab-color'] as const)('%s tens rods stand upright', (style) => {
    const { container } = render(<MabPlaceColumn count={2} place="tens" style={style} squarePattern />);
    const rods = container.querySelectorAll('svg');
    expect(rods).toHaveLength(2);
    for (const rod of rods) {
        expect(Number.parseFloat(rod.getAttribute('height')!)).toBeGreaterThan(Number.parseFloat(rod.getAttribute('width')!));
    }
});

test.each(['mab-bw', 'mab-color'] as const)('%s recognition tens rods stay legible without growing taller', (style) => {
    const { container } = render(<MabPlaceColumn count={9} place="tens" style={style} squarePattern />);
    for (const rod of container.querySelectorAll('svg')) {
        expect(Number.parseFloat(rod.getAttribute('width')!)).toBeCloseTo(5 / 17.33);
        expect(Number.parseFloat(rod.getAttribute('height')!)).toBeCloseTo(30 / 17.33);
    }
});

test('four-digit MAB generation can require a filled D column', () => {
    const block = makeBlock('mab-herkennen', { constraints: { maxNumber: 9999, operand1Mask: { D: true } } });
    const exercises = generateMabExercises(block);
    expect(exercises).toHaveLength(block.numberOfExercises);
    expect(exercises.every(ex => ex.value >= 1000 && ex.value <= 9999)).toBe(true);
});

test.each(['mab-herkennen', 'mab-tekenen'] as const)('%s fits nine D cubes in two rows on four-digit worksheets', (typeId) => {
    const block = makeBlock(typeId, { constraints: { maxNumber: 9999, mabStyle: 'mab-bw' } });
    block.mabExercises = [{ id: 'nine', value: 9999, thousands: 9, hundreds: 9, tens: 9, units: 9, isManuallyEdited: false }];
    const Viewer = EXERCISE_UI[typeId].Viewer;
    for (const width of [FULL_BLOCK_WIDTH_PX, 315]) {
        const { container } = render(
            <BlockWidthProvider value={width}>
                <Viewer block={block} showSolutions />
            </BlockWidthProvider>,
        );
        const dCell = Array.from(container.querySelectorAll('.print-exercise svg'))
            .filter(svg => svg.getAttribute('viewBox') === '-1 -1 36 36');
        expect(dCell).toHaveLength(9);
        expect(dCell[0].parentElement?.parentElement?.getAttribute('style')).toContain('grid-template-rows: repeat(2, auto)');
        const table = container.querySelector('.print-exercise div[style*="grid-template-columns"]') as HTMLElement;
        const columnWidth = Number(table.style.gridTemplateColumns.match(/repeat\(4, ([\d.]+)em\)/)?.[1]);
        expect(columnWidth).toBeGreaterThanOrEqual((5 * 36 + 4 * 2 + 2 * 3 + 4) / 17.33);
        const drawingArea = container.querySelector('.print-exercise > div')?.lastElementChild as HTMLElement;
        expect(Number.parseFloat(drawingArea.style.height) * 17.33).toBeGreaterThanOrEqual(typeId === 'mab-tekenen' ? 86 : 78);
    }
});

test('four-digit recognition columns fit nine large H plates', () => {
    const block = makeBlock('mab-herkennen', { constraints: { maxNumber: 9999, mabStyle: 'mab-color' } });
    block.mabExercises = [{ id: 'nine', value: 9999, thousands: 9, hundreds: 9, tens: 9, units: 9, isManuallyEdited: false }];
    const Viewer = EXERCISE_UI['mab-herkennen'].Viewer;
    for (const width of [FULL_BLOCK_WIDTH_PX, 315]) {
        const { container } = render(<BlockWidthProvider value={width}><Viewer block={block} showSolutions={false} /></BlockWidthProvider>);
        const table = container.querySelector('.print-exercise div[style*="grid-template-columns"]') as HTMLElement;
        const columnWidth = Number(table.style.gridTemplateColumns.match(/repeat\(4, ([\d.]+)em\)/)?.[1]);
        expect(columnWidth).toBeGreaterThanOrEqual((5 * 32 + 4 * 2 + 2 * 3 + 4) / 17.33);
        expect(Array.from(container.querySelectorAll('svg')).filter(svg => svg.getAttribute('viewBox') === '0 0 32 32')).toHaveLength(9);
    }
});

test.each(['mab-herkennen', 'mab-tekenen'])('%s can show one exercise per row without regenerating', (typeId) => {
    const store = useWorksheetStore.getState();
    store.clearBlocks();
    store.addBlockFromType(typeId, 'MAB');
    const block = useWorksheetStore.getState().blocks[0];
    const exerciseIds = block.mabExercises?.map(ex => ex.id) ?? [];
    expect(exerciseIds.length).toBeGreaterThan(0);

    const config = render(<MabAppearanceConfig block={block} />);
    fireEvent.click(config.getByRole('button', { name: 'Oefeningen per rij' }));
    fireEvent.click(config.getByRole('option', { name: '1 oefening' }));

    const updated = useWorksheetStore.getState().blocks[0];
    expect(updated.constraints.exercisesPerRow).toBe(1);
    expect(updated.mabExercises?.map(ex => ex.id)).toEqual(exerciseIds);
    const Viewer = EXERCISE_UI[typeId].Viewer;
    const { container } = render(
        <BlockWidthProvider value={FULL_BLOCK_WIDTH_PX}>
            <Viewer block={updated} showSolutions={false} />
        </BlockWidthProvider>,
    );
    expect(container.querySelector('[data-cols]')?.getAttribute('data-cols')).toBe('1');
    expect(container.querySelectorAll('.print-row')).toHaveLength(exerciseIds.length);
    store.clearBlocks();
});

// The 1) / a) labels are an extra first child in the row, at the widths where a block is
// tightest — a label that pushed the sum off the cell would only show up here.
describe.each(['hr-std-optellen', 'rekenvolgorde'])('%s with per-exercise numbering', (typeId) => {
    test.each(WIDTHS.flatMap(w => [false, true].flatMap(sol =>
        (['cijfer', 'letter'] as const).map(mode => [w, sol, mode] as const))))(
        'renders at %ipx, showSolutions=%s, itemNumbering=%s', (width, showSolutions, itemNumbering) => {
            const { Viewer } = EXERCISE_UI[typeId];
            const def = REGISTRY[typeId];
            const block = makeBlock(typeId, { block: { itemNumbering } });
            (block as unknown as Record<string, unknown>)[def.exerciseField] = def.generate(block);

            const { container } = render(
                <BlockWidthProvider value={width}>
                    <Viewer block={block} showSolutions={showSolutions} />
                </BlockWidthProvider>,
            );

            expect(container.textContent).toContain(itemNumbering === 'cijfer' ? '1)' : 'a)');
            const errors = consoleError.mock.calls.map((args: unknown[]) => String(args[0]));
            expect(errors, `${typeId} logged a React error at ${width}px`).toEqual([]);
        });
});

describe.each(typeIds)('%s', (typeId) => {
    test.each(WIDTHS.flatMap(w => [false, true].map(s => [w, s] as const)))('renders at %ipx, showSolutions=%s', (width, showSolutions) => {
        const { Viewer } = EXERCISE_UI[typeId];
        const def = REGISTRY[typeId];
        const block = makeBlock(typeId);
        (block as unknown as Record<string, unknown>)[def.exerciseField] = def.generate(block);

        const { container } = render(
            <BlockWidthProvider value={width}>
                <Viewer block={block} showSolutions={showSolutions} />
            </BlockWidthProvider>,
        );

        expect(container.childElementCount, `${typeId} rendered nothing at ${width}px`).toBeGreaterThan(0);

        const errors = consoleError.mock.calls.map((args: unknown[]) => String(args[0]));
        expect(errors, `${typeId} logged a React error at ${width}px`).toEqual([]);
    });
});
