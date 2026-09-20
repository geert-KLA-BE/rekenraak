// Dutch number-to-words for the positietabel splitsen variant (0 … 1 miljard).

const ONES = [
    'nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen',
    'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien',
];
const TENS = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];

function underHundred(n: number): string {
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return TENS[t];
    // 'en' join; twee/drie take a trema to avoid the ee/ie+e vowel collision.
    const joiner = u === 2 || u === 3 ? 'ën' : 'en';
    return ONES[u] + joiner + TENS[t];
}

function underThousand(n: number): string {
    if (n < 100) return underHundred(n);
    const h = Math.floor(n / 100), r = n % 100;
    return (h === 1 ? '' : ONES[h]) + 'honderd' + (r ? underHundred(r) : '');
}

// miljoen/miljard are separate nouns (space before them); duizend attaches to its
// count instead, same as underThousand's own honderd.
function intToDutchWords(n: number): string {
    if (n === 0) return 'nul';
    const mrd = Math.floor(n / 1_000_000_000);
    const afterMrd = n % 1_000_000_000;
    const mln = Math.floor(afterMrd / 1_000_000);
    const afterMln = afterMrd % 1_000_000;
    const th = Math.floor(afterMln / 1000);
    const rest = afterMln % 1000;

    const parts: string[] = [];
    if (mrd) parts.push((mrd === 1 ? 'een' : underThousand(mrd)) + ' miljard');
    if (mln) parts.push((mln === 1 ? 'een' : underThousand(mln)) + ' miljoen');
    let tail = '';
    if (th) tail += (th === 1 ? '' : underThousand(th)) + 'duizend';
    if (rest) tail += underThousand(rest);
    if (tail) parts.push(tail);
    return parts.join(' ');
}

export function numberToDutchWords(n: number): string {
    if (Number.isInteger(n)) return intToDutchWords(n);
    // Decimal: "<int> komma <digit> <digit> …" (e.g. 3,45 → "drie komma vier vijf").
    const neg = n < 0;
    const trimmed = Math.abs(n).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    const [ip, dp = ''] = trimmed.split('.');
    const intWords = intToDutchWords(Number(ip));
    const decWords = dp.split('').map(d => ONES[Number(d)]).join(' ');
    return (neg ? 'min ' : '') + intWords + (decWords ? ' komma ' + decWords : '');
}
