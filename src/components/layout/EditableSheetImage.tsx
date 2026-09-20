import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { PageImage } from '../../store/useWorksheetStore';

// A page-design image, draggable to move, draggable (bottom-right handle) to resize, and
// draggable (top handle) to rotate — directly on the sheet, replacing sliders with the
// same direct-manipulation the block drag already uses (useSheetDnd), minus the
// reorder/zone/autoscroll machinery those don't need.
//
// Pointer coordinates are in visual (sheet-zoomed) px — `.print-area-shell` scales via CSS
// `zoom`, not `transform` — so a raw client-px delta is divided by `zoom` to get the
// layout-px delta these fields are stored in (see useSheetDnd.ts for the same rule applied
// to hit-testing, where pointer and rect are both visual and the zoom cancels; here we are
// producing a NEW layout value from a visual delta, so the division is needed).
export type PageImagePatch = Partial<Pick<PageImage, 'x' | 'y' | 'width' | 'height' | 'rotation'>>;

interface Props {
    image: PageImage;
    editable: boolean;
    zoom: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    onCommit: (patch: PageImagePatch) => void;
}

const RAD_TO_DEG = 180 / Math.PI;

export default function EditableSheetImage({
    image, editable, zoom, minWidth = 16, maxWidth = 1000, minHeight = 16, maxHeight = 1400, onCommit,
}: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    // Only used WHILE actively dragging, for a live preview — the store (and therefore
    // every consumer, including print) is only touched once, on release.
    const [live, setLive] = useState<PageImagePatch | null>(null);
    const shown = { ...image, ...live };

    const beginMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!editable || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const el = e.currentTarget;
        const pointerId = e.pointerId;
        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const { x: originX, y: originY } = image;
        try { el.setPointerCapture(pointerId); } catch { /* pointer already gone */ }

        const step = (ev: globalThis.PointerEvent): PageImagePatch => ({
            x: originX + (ev.clientX - startClientX) / zoom,
            y: originY + (ev.clientY - startClientY) / zoom,
        });
        const onMove = (ev: globalThis.PointerEvent) => setLive(step(ev));
        const onUp = (ev: globalThis.PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            try { el.releasePointerCapture(pointerId); } catch { /* already released */ }
            const next = step(ev);
            setLive(null);
            onCommit(next);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const beginResize = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!editable || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const el = e.currentTarget;
        const pointerId = e.pointerId;
        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const { width: startWidth, height: startHeight, rotation } = image;
        // The resize handle moves along the box's OWN (possibly rotated) axes, not the
        // screen's — the screen-space mouse delta is rotated by -rotation into the box's
        // local frame before it changes width/height. x/y (top-left, pre-rotation) stay
        // fixed in that local frame: the same simplification most CSS-transform-based
        // resizers use, so a rotated box's anchor corner visibly drifts a little on screen
        // as it grows rather than solving for a screen-fixed corner.
        const rad = rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        try { el.setPointerCapture(pointerId); } catch { /* pointer already gone */ }

        const step = (ev: globalThis.PointerEvent): PageImagePatch => {
            const dxScreen = (ev.clientX - startClientX) / zoom;
            const dyScreen = (ev.clientY - startClientY) / zoom;
            const localDx = dxScreen * cos + dyScreen * sin;
            const localDy = -dxScreen * sin + dyScreen * cos;
            return {
                width: Math.min(maxWidth, Math.max(minWidth, startWidth + localDx)),
                height: Math.min(maxHeight, Math.max(minHeight, startHeight + localDy)),
            };
        };
        const onMove = (ev: globalThis.PointerEvent) => setLive(step(ev));
        const onUp = (ev: globalThis.PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            try { el.releasePointerCapture(pointerId); } catch { /* already released */ }
            const next = step(ev);
            setLive(null);
            onCommit(next);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const beginRotate = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!editable || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const el = e.currentTarget;
        const pointerId = e.pointerId;
        // rotate() defaults to transform-origin: center, so the box's screen center stays
        // put regardless of angle — a stable pivot to measure the pointer's angle from.
        const rect = wrapRef.current?.getBoundingClientRect();
        const cx = rect ? rect.left + rect.width / 2 : e.clientX;
        const cy = rect ? rect.top + rect.height / 2 : e.clientY;
        try { el.setPointerCapture(pointerId); } catch { /* pointer already gone */ }

        // +90 so the handle (rendered above the box) points straight up at rotation 0.
        const step = (ev: globalThis.PointerEvent): PageImagePatch => {
            const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * RAD_TO_DEG + 90;
            return { rotation: ((angle % 360) + 360) % 360 };
        };
        const onMove = (ev: globalThis.PointerEvent) => setLive(step(ev));
        const onUp = (ev: globalThis.PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            try { el.releasePointerCapture(pointerId); } catch { /* already released */ }
            const next = step(ev);
            setLive(null);
            onCommit(next);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    return (
        <div
            ref={wrapRef}
            className={`sheet-image${editable ? ' sheet-image-editable' : ''}`}
            style={{
                position: 'absolute',
                left: `${shown.x}px`, top: `${shown.y}px`,
                width: `${shown.width}px`, height: `${shown.height}px`,
                transform: `rotate(${shown.rotation}deg)`,
                transformOrigin: 'center center',
            }}
        >
            <img src={image.src} alt="" draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'fill', opacity: image.opacity, display: 'block', pointerEvents: 'none' }} />
            {editable && (
                <>
                    <div className="no-print sheet-image-move" onPointerDown={beginMove} title="Verslepen" />
                    <div className="no-print sheet-image-resize" onPointerDown={beginResize} title="Grootte aanpassen" />
                    <div className="no-print sheet-image-rotate-line" />
                    <div className="no-print sheet-image-rotate" onPointerDown={beginRotate} title="Draaien" />
                </>
            )}
        </div>
    );
}
