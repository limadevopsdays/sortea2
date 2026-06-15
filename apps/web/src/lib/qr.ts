/**
 * Genera el QR de marca DevOpsDays como SVG: ojos redondeados en morado,
 * módulos punteados, logo al centro y esquinas lima. Devuelve markup SVG.
 * Corrección de error 'H' (~30%) para tolerar el logo central.
 */
import qrcode from 'qrcode-generator';

const DATA = '#2E0A57';
const EYE = '#53099E';
const PAPER = '#FBFAF7';
const LIME = '#A3E37C';

export function buildBrandedQrSvg(url: string, logoHref = './isotipo-morado.svg'): string {
  const qr = qrcode(0, 'H');
  qr.addData(url);
  qr.make();

  const count = qr.getModuleCount();
  const m = 8;
  const size = count * m;
  const pad = m * 1.4;

  const inFinder = (r: number, c: number): boolean =>
    (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);

  const logoSpan = Math.ceil(count * 0.22);
  const logoLo = Math.floor((count - logoSpan) / 2);
  const logoHi = logoLo + logoSpan;
  const inLogo = (r: number, c: number): boolean => r >= logoLo && r < logoHi && c >= logoLo && c < logoHi;

  let dots = '';
  const inset = m * 0.11, dotSz = m - inset * 2, dotR = dotSz * 0.3;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!qr.isDark(r, c) || inFinder(r, c) || inLogo(r, c)) continue;
      const x = (c * m + inset).toFixed(2), y = (r * m + inset).toFixed(2);
      dots += `<rect x="${x}" y="${y}" width="${dotSz.toFixed(2)}" height="${dotSz.toFixed(2)}" rx="${dotR.toFixed(2)}" fill="${DATA}"/>`;
    }
  }

  const finder = (cx: number, cy: number): string => {
    const px = cx * m, py = cy * m, s = 7 * m;
    return (
      `<rect x="${px}" y="${py}" width="${s}" height="${s}" rx="${(2.2 * m).toFixed(2)}" fill="${EYE}"/>` +
      `<rect x="${px + m}" y="${py + m}" width="${5 * m}" height="${5 * m}" rx="${(1.5 * m).toFixed(2)}" fill="${PAPER}"/>` +
      `<rect x="${px + 2 * m}" y="${py + 2 * m}" width="${3 * m}" height="${3 * m}" rx="${(1.0 * m).toFixed(2)}" fill="${EYE}"/>`
    );
  };
  const eyes = finder(0, 0) + finder(count - 7, 0) + finder(0, count - 7);

  const bw = size * 0.26, bx = (size - bw) / 2, lpad = bw * 0.18;
  const badge =
    `<rect x="${bx.toFixed(2)}" y="${bx.toFixed(2)}" width="${bw.toFixed(2)}" height="${bw.toFixed(2)}" rx="${(bw * 0.26).toFixed(2)}" fill="${PAPER}"/>` +
    `<image href="${logoHref}" x="${(bx + lpad).toFixed(2)}" y="${(bx + lpad).toFixed(2)}" width="${(bw - lpad * 2).toFixed(2)}" height="${(bw - lpad * 2).toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`;

  const off = -m * 0.4, far = size + m * 0.4, L = m * 3.2, t = m * 0.55;
  const bracket = (d: string): string =>
    `<path d="${d}" fill="none" stroke="${LIME}" stroke-width="${t.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const brackets =
    bracket(`M ${off},${off + L} L ${off},${off} L ${off + L},${off}`) +
    bracket(`M ${far - L},${off} L ${far},${off} L ${far},${off + L}`) +
    bracket(`M ${off},${far - L} L ${off},${far} L ${off + L},${far}`) +
    bracket(`M ${far - L},${far} L ${far},${far} L ${far},${far - L}`);

  const vb = `${-pad} ${-pad} ${size + 2 * pad} ${size + 2 * pad}`;
  return (
    `<svg viewBox="${vb}" style="display:block;width:100%;height:auto;background:transparent" xmlns="http://www.w3.org/2000/svg">` +
    dots + eyes + badge + brackets +
    `</svg>`
  );
}
