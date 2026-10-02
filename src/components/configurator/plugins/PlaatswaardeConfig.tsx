import { useConstraints } from '../useConstraints';
import type { MathBlock } from '../../../services/math/types';
import { getMaskPlaces } from '../../../services/math/mathEngine';
import { sharedPluginStyles as styles } from './sharedPluginStyles';
import PopupSelect from '../../ui/PopupSelect';
import SettingLabel from './SettingLabel';
import type { PlaatswaardeConstraints } from '../../../services/math/constraintTypes';

interface Props { block: MathBlock; }

const MAX_PRESETS = [10, 20, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];

export default function PlaatswaardeConfig({ block }: Props) {
    const [c, patch] = useConstraints<PlaatswaardeConstraints>(block);
    const { maxGetal = 1000, numberMask = {}, decimalPlaces = 0, tablePlaces } = c;

    const set = (key: string, value: unknown) =>
        patch({ [key]: value } as Partial<PlaatswaardeConstraints>);

    const toggleMask = (k: string) => set('numberMask', { ...numberMask, [k]: !numberMask[k] });
    const places = getMaskPlaces(maxGetal, decimalPlaces > 0 ? 'decimal' : 'natural', decimalPlaces);
    const tableOptions = getMaskPlaces(1_000_000_000, decimalPlaces > 0 ? 'decimal' : 'natural', decimalPlaces);
    const shownPlaces = tablePlaces ?? places.map(p => p.key);
    const toggleTablePlace = (key: string) => {
        const next = shownPlaces.includes(key) ? shownPlaces.filter(place => place !== key) : [...shownPlaces, key];
        if (next.length > 0) set('tablePlaces', next);
    };

    // subType (view) is chosen by the sidebar leaf — not repeated here.
    return (
        <div style={styles.container}>
            <div style={styles.section}>
                <SettingLabel text="Maximum getal:" info="Het grootste getal dat in de oefeningen mag voorkomen." />
                <PopupSelect
                    clampToLowest
                    value={maxGetal}
                    options={MAX_PRESETS.map(v => ({ value: v, label: `Tot ${v.toLocaleString('nl-BE')}` }))}
                    onChange={(v) => set('maxGetal', v)}
                    ariaLabel="Maximum getal"
                />
            </div>

            <div style={styles.section}>
                <SettingLabel text="Decimalen:" info="Aantal decimalen achter de komma." />
                <PopupSelect
                    value={decimalPlaces}
                    options={[0, 1, 2, 3].map(v => ({ value: v, label: v === 0 ? 'Geen' : String(v) }))}
                    onChange={(v) => set('decimalPlaces', v)}
                    ariaLabel="Decimalen"
                />
            </div>

            <div style={styles.section}>
                <SettingLabel text="Specifieke getalopbouw:" info="Kies welke posities een cijfer mogen bevatten. Leeg = vrij." />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {places.map(p => (
                        <button key={p.key} onClick={() => toggleMask(p.key)} style={styles.maskBtn(!!numberMask[p.key])} title={p.label}>{p.key}</button>
                    ))}
                </div>
                <p style={styles.hint}>Leeg = vrije opbouw.</p>
            </div>
            {c.subType === 'tabel' && (
                <div style={styles.section}>
                    <SettingLabel text="Kolommen in tabel:" info="Kies welke plaatswaarden zichtbaar zijn, onafhankelijk van het maximum getal." />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {tableOptions.map(p => (
                            <button key={p.key} type="button" aria-pressed={shownPlaces.includes(p.key)} onClick={() => toggleTablePlace(p.key)} style={styles.maskBtn(shownPlaces.includes(p.key))} title={p.label}>{p.key}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
