import { useState } from 'react';
import { FloppyDisk, PencilSimple, Trash } from '@phosphor-icons/react';
import { useWorksheetStore } from '../../store/useWorksheetStore';
import { loadPageDesigns, savePageDesign, deletePageDesign, renamePageDesign, type PageDesign } from '../../services/persistence';
import ModalShell from '../ui/ModalShell';

interface Props {
    onClose: () => void;
}

// General-menu counterpart of the old Inspector "Ontwerp" tab: bewaar/toepas/hernoem/
// verwijder the named page-design library (docSettings — styles + koptekst/opdrachten/
// voettekst look + generic content settings, NOT the blocks). Reachable from anywhere,
// not just while on the Blad panel.
export default function PageDesignsModal({ onClose }: Props) {
    const docSettings = useWorksheetStore((s) => s.docSettings);
    const updateDocSettings = useWorksheetStore((s) => s.updateDocSettings);
    const [designs, setDesigns] = useState<PageDesign[]>(() => loadPageDesigns());
    const refresh = () => setDesigns(loadPageDesigns());
    // window.prompt throws (rather than returning null) in some browsers/webviews with
    // native dialogs disabled — an in-app modal works everywhere, including there.
    const [nameModal, setNameModal] = useState<{ mode: 'save' | 'rename'; targetId?: string } | null>(null);
    const [nameValue, setNameValue] = useState('');

    const handleSaveDesign = () => { setNameValue(''); setNameModal({ mode: 'save' }); };
    const handleApply = (d: PageDesign) => {
        if (window.confirm(`Pagina-ontwerp "${d.name}" toepassen op dit blad?`)) updateDocSettings(d.docSettings);
    };
    const handleRename = (d: PageDesign) => { setNameValue(d.name); setNameModal({ mode: 'rename', targetId: d.id }); };
    const handleDelete = (d: PageDesign) => {
        if (window.confirm(`"${d.name}" verwijderen?`)) { deletePageDesign(d.id); refresh(); }
    };
    const handleNameConfirm = () => {
        if (!nameModal) return;
        if (nameModal.mode === 'save') {
            if (!savePageDesign(nameValue, docSettings)) {
                window.alert('Opslaan mislukt: de opslagruimte van je browser zit vol. Verwijder een ander pagina-ontwerp of gebruik kleinere afbeeldingen en probeer opnieuw.');
                return;
            }
        } else if (nameModal.targetId) {
            renamePageDesign(nameModal.targetId, nameValue);
        }
        setNameModal(null);
        refresh();
    };

    return (
        <ModalShell onClose={onClose} ariaLabel="Pagina-ontwerp sjablonen" maxWidth={420}>
            <div style={S.body}>
                <h2 style={S.title}>Pagina-ontwerp sjablonen</h2>
                <p style={S.hintText}>Bewaar de opmaak van dit blad (koptekst, voettekst, lettertypes, afbeeldingen…) als sjabloon en pas het toe op elk ander blad.</p>
                <button type="button" style={S.saveBtn} onClick={handleSaveDesign}>
                    <FloppyDisk size={14} /> Huidig ontwerp bewaren als sjabloon
                </button>
                {designs.length === 0 ? (
                    <p style={S.hintText}>Nog geen sjablonen bewaard.</p>
                ) : (
                    <ul style={S.designList}>
                        {designs.map((d) => (
                            <li key={d.id} style={S.designRow}>
                                <span style={S.designName}>{d.name}</span>
                                <div style={S.designActions}>
                                    <button type="button" style={S.miniBtn} onClick={() => handleApply(d)}>Toepassen</button>
                                    <button type="button" style={S.iconBtn} onClick={() => handleRename(d)} aria-label="Hernoemen" title="Hernoemen"><PencilSimple size={13} /></button>
                                    <button type="button" style={S.iconBtn} onClick={() => handleDelete(d)} aria-label="Verwijderen" title="Verwijderen"><Trash size={13} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {nameModal && (
                <ModalShell
                    onClose={() => setNameModal(null)}
                    ariaLabel={nameModal.mode === 'save' ? 'Pagina-ontwerp bewaren' : 'Pagina-ontwerp hernoemen'}
                    maxWidth={360}
                >
                    <form
                        style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
                        onSubmit={(e) => { e.preventDefault(); handleNameConfirm(); }}
                    >
                        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>
                            {nameModal.mode === 'save' ? 'Naam voor dit pagina-ontwerp' : 'Nieuwe naam'}
                        </h4>
                        <input
                            autoFocus
                            type="text"
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            maxLength={80}
                            style={S.nameInput}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                            <button type="button" style={S.miniBtn} onClick={() => setNameModal(null)}>Annuleren</button>
                            <button type="submit" style={S.saveBtn}>Bewaren</button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </ModalShell>
    );
}

const S = {
    body: { padding: 'var(--sp-5)' } as React.CSSProperties,
    title: { margin: '0 0 var(--sp-3)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.01em' } as React.CSSProperties,
    hintText: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 var(--sp-3)', lineHeight: 1.4 } as React.CSSProperties,
    saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: 'var(--text-sm)', fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: 'none', background: 'var(--accent)', color: '#fff', marginBottom: 'var(--sp-3)' } as React.CSSProperties,
    nameInput: { padding: '8px 10px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--separator)', background: 'var(--bg-surface)', color: 'var(--text-main)' } as React.CSSProperties,
    designList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' } as React.CSSProperties,
    designRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)', padding: '6px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface-2)' } as React.CSSProperties,
    designName: { fontSize: 'var(--text-sm)', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as React.CSSProperties,
    designActions: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 } as React.CSSProperties,
    miniBtn: { padding: '5px 10px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', border: '1px solid var(--separator)', background: 'var(--bg-surface)', color: 'var(--text-main)' } as React.CSSProperties,
    iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: '1px solid var(--separator)', background: 'var(--bg-surface)', color: 'var(--text-muted)', borderRadius: 'var(--radius-xs)', cursor: 'pointer' } as React.CSSProperties,
};
