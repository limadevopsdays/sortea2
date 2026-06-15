/**
 * Motor de animaciones de sorteo — agnóstico del framework.
 * Portado del prototipo de Claude Design: cada modo manipula su propio nodo
 * `stage` y resuelve la promesa en el instante en que se "revela" al ganador,
 * momento en que React muestra la tarjeta de ganador + confetti.
 *
 * El ganador YA viene decidido por el backend (winIdx); aquí solo es teatro.
 */
import type { Participant, RaffleMode } from '@sortea2/shared';
import { sound } from '../lib/sound';

type P = Pick<Participant, 'name' | 'avatar'>;

const esc = (s: string): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

const av = (p: P): string =>
  p.avatar?.type === 'photo' && p.avatar.value
    ? `<img src="${p.avatar.value}" alt="">`
    : p.avatar?.value || '🙂';

/** Paleta de cuys — un color (con su versión clara/oscura) por carril. */
const CUY_COLORS = [
  { body: '#C8772E', light: '#F0C99A', dark: '#8A4E18' },
  { body: '#F2E9D8', light: '#FFFFFF', dark: '#C9B894' },
  { body: '#9AA0A6', light: '#D7DBDF', dark: '#5F656B' },
  { body: '#6B1FC7', light: '#A17CD1', dark: '#3D0B7A' },
  { body: '#E8852E', light: '#F8C98C', dark: '#A8581A' },
  { body: '#3FB6A8', light: '#9BE0D8', dark: '#237A70' },
  { body: '#E78FA6', light: '#F6C9D5', dark: '#B25C73' },
  { body: '#FFD15C', light: '#FFE9A8', dark: '#C99A20' },
  { body: '#A3E37C', light: '#D6F4BD', dark: '#5E9A38' },
  { body: '#5A4A6A', light: '#9387A6', dark: '#322640' },
];

/** SVG de un cuy de perfil mirando a la meta (derecha), con patas animables. */
function cuySvg(c: { body: string; light: string; dark: string }): string {
  return `<svg class="cuy-svg" viewBox="0 0 64 40" width="60" height="38" aria-hidden="true">
    <ellipse class="cuy-shadow" cx="28" cy="37" rx="18" ry="2.6"/>
    <g class="cuy-legs">
      <rect class="cuy-leg cuy-leg-b" x="17" y="27" width="5" height="9" rx="2.5" fill="${c.dark}"/>
      <rect class="cuy-leg cuy-leg-a" x="33" y="27" width="5" height="9" rx="2.5" fill="${c.dark}"/>
    </g>
    <g class="cuy-body-g">
      <ellipse cx="28" cy="22" rx="20" ry="13" fill="${c.body}"/>
      <ellipse cx="25" cy="26" rx="13" ry="6.5" fill="${c.light}" opacity="0.9"/>
      <circle cx="46" cy="20" r="9" fill="${c.body}"/>
      <ellipse cx="43" cy="12.5" rx="3.4" ry="4.4" fill="${c.dark}"/>
      <ellipse cx="50" cy="24" rx="3" ry="2" fill="${c.light}" opacity="0.7"/>
      <circle cx="49.5" cy="19" r="1.7" fill="#0E0520"/>
      <circle cx="55" cy="22.5" r="1.7" fill="#0E0520"/>
    </g>
  </svg>`;
}

type ModeFn = (stage: HTMLElement, list: P[], winIdx: number) => Promise<void>;

export function runRaffleMode(
  mode: RaffleMode,
  stage: HTMLElement,
  list: P[],
  winIdx: number,
): Promise<void> {
  const fns: Record<RaffleMode, ModeFn> = {
    ruleta: runRuleta,
    cuys: runCuys,
    slot: runSlot,
    dardos: runDardos,
    cartas: runCartas,
    paracaidas: runParacaidas,
    bracket: runBracket,
    bola: runBola,
  };
  return (fns[mode] ?? runRuleta)(stage, list, winIdx);
}

/* ---- Ruleta ---- */
function runRuleta(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const N = list.length;
    const seg = 360 / N;
    const colors = ['#53099E', '#A17CD1', '#6B1FC7', '#A3E37C', '#2E005A', '#FFD15C'];
    const cx = 300, cy = 300, r = 290;
    // Con muchos participantes las etiquetas no caben: se muestran flotando
    // alrededor de la ruleta en vez de sobre los gajos.
    const manyMode = N > 30;
    let paths = '', labels = '';
    for (let i = 0; i < N; i++) {
      const a1 = (i * seg - 90) * Math.PI / 180;
      const a2 = ((i + 1) * seg - 90) * Math.PI / 180;
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = seg > 180 ? 1 : 0;
      const col = colors[i % colors.length]!;
      paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${col}" stroke="#0E0520" stroke-width="${manyMode ? 1 : 2}"/>`;
      if (!manyMode) {
        const am = (i * seg + seg / 2 - 90) * Math.PI / 180;
        const lx = cx + r * 0.62 * Math.cos(am);
        const ly = cy + r * 0.62 * Math.sin(am);
        const rot = i * seg + seg / 2;
        const p = list[i]!;
        const display = (p.avatar?.type === 'emoji' ? p.avatar.value + '  ' : '') + (p.name || '').split(' ')[0];
        const dark = col === '#A3E37C' || col === '#FFD15C';
        const fontSize = N <= 8 ? 18 : N <= 14 ? 14 : 11;
        labels += `<text x="${lx}" y="${ly}" transform="rotate(${rot} ${lx} ${ly})" fill="${dark ? '#0E0520' : '#fff'}" font-family="Orbitron, sans-serif" font-weight="700" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${esc(display).slice(0, 14)}</text>`;
      }
    }
    stage.innerHTML = `
      <div class="ruleta-wrap">
        <div class="ruleta-pointer"></div>
        <svg class="ruleta-svg" id="ruleta-svg" viewBox="0 0 600 600">
          <circle cx="300" cy="300" r="294" fill="none" stroke="#A3E37C" stroke-width="3"/>
          <g id="ruleta-rotor">${paths}${labels}</g>
        </svg>
        <button class="ruleta-center" id="ruleta-spin" type="button">SPIN</button>
        <div class="ruleta-orbit" id="ruleta-orbit"></div>
      </div>`;

    // avatares flotando alrededor (solo con muchos participantes)
    if (manyMode) {
      const wrapEl = stage.querySelector<HTMLElement>('.ruleta-wrap')!;
      const orbit = stage.querySelector<HTMLElement>('#ruleta-orbit')!;
      requestAnimationFrame(() => {
        const size = wrapEl.clientWidth || 560;
        const R = size * 0.54;
        const c0 = size / 2;
        const aSize = Math.max(9, Math.min(36, ((2 * Math.PI * R) / N) * 0.82));
        list.forEach((p, i) => {
          const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
          const x = c0 + R * Math.cos(ang);
          const y = c0 + R * Math.sin(ang);
          const el = document.createElement('div');
          el.className = 'orbit-av';
          el.dataset.idx = String(i);
          el.style.left = x - aSize / 2 + 'px';
          el.style.top = y - aSize / 2 + 'px';
          el.style.width = el.style.height = aSize + 'px';
          el.style.fontSize = aSize * 0.6 + 'px';
          el.style.animationDelay = (Math.random() * 2).toFixed(2) + 's';
          el.innerHTML = av(p);
          orbit.appendChild(el);
        });
      });
    }

    // Spin MANUAL: la ruleta no gira hasta que se pulsa el botón.
    const winnerMid = winIdx * seg + seg / 2;
    const target = 360 * 6 - winnerMid;
    const svg = stage.querySelector<SVGElement>('#ruleta-svg')!;
    const spinBtn = stage.querySelector<HTMLButtonElement>('#ruleta-spin')!;
    let spun = false;
    spinBtn.addEventListener('click', () => {
      if (spun) return;
      spun = true;
      spinBtn.classList.add('spinning');
      spinBtn.textContent = '···';
      requestAnimationFrame(() => {
        svg.style.transform = `rotate(${target}deg)`;
      });
      setTimeout(() => {
        if (manyMode) {
          stage.querySelector<HTMLElement>(`.orbit-av[data-idx="${winIdx}"]`)?.classList.add('winner');
        }
        resolve();
      }, 5800);
    });
  });
}

/* ---- Cuys ---- */
function runCuys(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'cuy-track-wrap';
    list.forEach((p, i) => {
      const lane = document.createElement('div');
      lane.className = 'cuy-lane';
      lane.dataset.idx = String(i);
      const c = CUY_COLORS[i % CUY_COLORS.length]!;
      lane.innerHTML = `
        <div class="lane-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="lane-name">${esc(p.name)}</div>
        <div class="cuy-place"></div>
        <div class="cuy"><div class="cuy-inner">${cuySvg(c)}<div class="cuy-rider">${av(p)}</div></div></div>`;
      wrap.appendChild(lane);
    });
    stage.innerHTML = '';
    stage.appendChild(wrap);

    // Ajusta alto de carril y escala del cuy para que TODOS entren en pantalla.
    // Si aun así no caben (muchísimos), el track hace scroll.
    const availH = (stage.clientHeight || 600) - 56;
    const laneH = Math.max(14, Math.min(56, Math.floor(availH / list.length)));
    wrap.style.setProperty('--lane-h', laneH + 'px');
    wrap.style.setProperty('--cuy-scale', String(Math.max(0.42, Math.min(1, laneH / 52))));
    wrap.classList.toggle('compact', laneH < 30);

    const trackWidth = wrap.clientWidth - 70 - 180 - 60;

    // ── Cuenta regresiva 3·2·1·¡CORRAN! con sonido, luego arranca ──
    sound.unlock();
    const cd = document.createElement('div');
    cd.className = 'race-countdown';
    stage.appendChild(cd);
    const cdSteps = ['3', '2', '1', '¡CORRAN!'];
    let cdi = 0;
    const cdStep = (): void => {
      if (cdi >= cdSteps.length) {
        cd.remove();
        startRace();
        return;
      }
      cd.textContent = cdSteps[cdi]!;
      cd.classList.remove('go', 'tick');
      void cd.offsetWidth;
      cd.classList.add(cdi === 3 ? 'go' : 'tick');
      if (cdi < 3) sound.countBeep();
      else sound.go();
      cdi++;
      setTimeout(cdStep, cdi <= 3 ? 750 : 650);
    };
    cdStep();

    function startRace(): void {
    const start = Date.now();
    // Carrera con suspenso: el pelotón corre apretado y solo se define en la
    // recta final. El ganador (decidido por el backend) cruza primero; el resto
    // define 2º/3º… por orden de llegada. Todos terminan llegando a la meta.
    const WIN_TIME = 8200; // el ganador cruza a ~8.2s
    const SPRINT = 2800; // últimos 2.8s = recta final
    const sprintStart = WIN_TIME - SPRINT;
    const finishAt = list.map((_, i) =>
      i === winIdx ? WIN_TIME : WIN_TIME + 250 + Math.random() * 2000,
    );
    const phase = list.map(() => Math.random() * Math.PI * 2);
    const freq = list.map(() => 1.1 + Math.random() * 1.5);
    const amp = list.map(() => 0.035 + Math.random() * 0.05);
    const packAt = list.map(() => 0);
    const positions = list.map(() => 0);
    const placed = new Set<number>();
    let order = 0;
    let revealed = false;
    let nextWheek = 600;
    const easeOut = (t: number): number => 1 - Math.pow(1 - t, 2.4);
    const easeInOut = (t: number): number =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const medalFor = (place: number): string =>
      place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `${place}º`;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      list.forEach((_, i) => {
        const fa = finishAt[i]!;
        let frac: number;
        if (elapsed >= fa) {
          frac = 1;
        } else if (elapsed < sprintStart) {
          // pelotón apretado con forcejeo (cambios de líder); nadie se escapa
          const tp = elapsed / sprintStart;
          const base = 0.08 + 0.6 * easeInOut(tp);
          const jostle =
            Math.sin(tp * Math.PI * 2 * freq[i]! + phase[i]!) * amp[i]! * (0.5 + tp * 0.5);
          frac = Math.min(0.78, base + jostle);
          packAt[i] = frac;
        } else {
          // recta final: del pelotón a su meta, en su tiempo
          const ts = (elapsed - sprintStart) / (fa - sprintStart);
          const s = packAt[i]!;
          frac = s + (1 - s) * easeOut(ts);
        }
        let pos = Math.max(positions[i]!, trackWidth * frac); // sin retroceder
        if (elapsed < fa) pos = Math.min(pos, trackWidth * 0.992); // no cruza antes
        else pos = trackWidth;
        positions[i] = pos;
        const cuy = wrap.querySelector<HTMLElement>(`.cuy-lane[data-idx="${i}"] .cuy`);
        if (cuy) cuy.style.left = 180 + pos + 'px';

        // cruzó la meta → asignar puesto y medalla
        if (elapsed >= fa && !placed.has(i)) {
          placed.add(i);
          const place = ++order;
          if (place === 1) sound.win();
          else if (place <= 3) sound.wheek();
          const lane = wrap.querySelector<HTMLElement>(`.cuy-lane[data-idx="${i}"]`);
          if (lane) {
            lane.classList.add('finished');
            if (place === 1) lane.classList.add('winner-lane');
            const medal = lane.querySelector<HTMLElement>('.cuy-place');
            if (medal) {
              medal.textContent = medalFor(place);
              medal.classList.add('show');
              if (place === 1) medal.classList.add('first');
              else if (place > 3) medal.classList.add('rank');
            }
          }
        }
      });

      // chillidos de cuy aleatorios durante la carrera
      if (placed.size < list.length && elapsed > nextWheek) {
        sound.wheek();
        nextWheek = elapsed + 350 + Math.random() * 700;
      }

      // revela al ganador cuando ya llegó el podio (o todos)
      if (!revealed && placed.size >= Math.min(3, list.length)) {
        revealed = true;
        setTimeout(resolve, 900);
      }
      if (placed.size >= list.length || elapsed > 14000) clearInterval(interval);
    }, 70);
    }
  });
}

/* ---- Slot ---- */
function runSlot(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const reelItems: P[] = [];
    const REPEATS = 8;
    for (let r = 0; r < REPEATS; r++) for (let i = 0; i < list.length; i++) reelItems.push(list[i]!);
    reelItems.push(list[winIdx]!);

    stage.innerHTML = `
      <div class="slot-frame">
        <div class="slot-header">★ Devops Slot ★</div>
        <div class="slot-window">
          <div class="slot-pointer"></div>
          <div class="slot-reel" id="slot-reel"></div>
        </div>
      </div>`;
    const reel = stage.querySelector<HTMLElement>('#slot-reel')!;
    reelItems.forEach((p) => {
      const it = document.createElement('div');
      it.className = 'slot-item';
      it.innerHTML = `<div class="avatar">${av(p)}</div><div>${esc(p.name)}</div>`;
      reel.appendChild(it);
    });
    requestAnimationFrame(() => {
      const itemH = 60;
      const winIndexInReel = reelItems.length - 1;
      const targetY = -(winIndexInReel * itemH) + 60;
      reel.style.transform = `translateY(${targetY}px)`;
    });
    setTimeout(resolve, 4200);
  });
}

/* ---- Dardos ---- */
function runDardos(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const N = list.length;
    const seg = 360 / N;
    const cx = 300, cy = 300, R = 250;
    const colors = ['#2E005A', '#53099E', '#A17CD1', '#1A0A32'];
    let segments = '', labels = '';
    for (let i = 0; i < N; i++) {
      const a1 = (i * seg - 90) * Math.PI / 180;
      const a2 = ((i + 1) * seg - 90) * Math.PI / 180;
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      const large = seg > 180 ? 1 : 0;
      const col = colors[i % colors.length]!;
      segments += `<path d="M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z" fill="${col}" stroke="#FBFAF7" stroke-width="1.5"/>`;
      const am = (i * seg + seg / 2 - 90) * Math.PI / 180;
      const lx = cx + R * 0.82 * Math.cos(am);
      const ly = cy + R * 0.82 * Math.sin(am);
      const p = list[i]!;
      const emo = p.avatar?.type === 'emoji' ? p.avatar.value : '🎯';
      const fontSize = N <= 8 ? 26 : N <= 14 ? 20 : 16;
      labels += `<text x="${lx}" y="${ly}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${emo}</text>`;
    }
    const winAm = (winIdx * seg + seg / 2 - 90) * Math.PI / 180;
    const dartX = cx + 55 * Math.cos(winAm);
    const dartY = cy + 55 * Math.sin(winAm);
    stage.innerHTML = `
      <div class="dart-wrap">
        <svg class="dart-board" id="dart-board" viewBox="0 0 600 600">
          <circle cx="300" cy="300" r="${R + 18}" fill="#0E0520" stroke="#A3E37C" stroke-width="3"/>
          <circle cx="300" cy="300" r="${R + 6}" fill="#0E0520"/>
          ${segments}
          ${labels}
          <circle cx="300" cy="300" r="80" fill="#0E0520" stroke="#FBFAF7" stroke-width="2"/>
          <circle cx="300" cy="300" r="42" fill="#A3E37C" stroke="#FBFAF7" stroke-width="2"/>
          <circle cx="300" cy="300" r="18" fill="#FFD15C"/>
        </svg>
        <div class="dart-impact" id="dart-impact" style="left: ${(dartX / 600) * 100}%; top: ${(dartY / 600) * 100}%;">
          <div class="dart-icon">🎯</div>
        </div>
      </div>`;
    setTimeout(() => {
      stage.querySelector('#dart-impact')!.classList.add('hit');
      stage.querySelector('#dart-board')!.classList.add('struck');
    }, 2000);
    setTimeout(resolve, 3000);
  });
}

/* ---- Cartas ---- */
function runCartas(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const winner = list[winIdx]!;
    stage.innerHTML = `
      <div class="cards-wrap">
        <div class="deck-pile">
          <div class="deck-back" style="transform: translate(-10px, -6px) rotate(-4deg);"></div>
          <div class="deck-back" style="transform: translate(-4px, -2px) rotate(-1deg);"></div>
          <div class="deck-back"></div>
        </div>
        <div class="playing-card" id="play-card">
          <div class="pc-corner" id="pc-tl">A♠</div>
          <div class="pc-center">
            <div class="pc-emoji" id="pc-emoji">🂠</div>
            <div class="pc-name" id="pc-name">—</div>
          </div>
          <div class="pc-corner br" id="pc-br">A♠</div>
        </div>
      </div>`;
    const card = stage.querySelector<HTMLElement>('#play-card')!;
    const emojiEl = stage.querySelector<HTMLElement>('#pc-emoji')!;
    const nameEl = stage.querySelector<HTMLElement>('#pc-name')!;
    const tlEl = stage.querySelector<HTMLElement>('#pc-tl')!;
    const brEl = stage.querySelector<HTMLElement>('#pc-br')!;
    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '7'];

    function setFace(p: P, isWin: boolean): void {
      emojiEl.innerHTML = av(p);
      nameEl.textContent = p.name;
      if (isWin) {
        tlEl.textContent = 'A♠';
        brEl.textContent = 'A♠';
      } else {
        const tag = RANKS[Math.floor(Math.random() * RANKS.length)]! + SUITS[Math.floor(Math.random() * SUITS.length)]!;
        tlEl.textContent = tag;
        brEl.textContent = tag;
      }
    }

    const start = performance.now();
    const total = 3600;
    let landed = false;
    let next = 0;

    function tick(now: number): void {
      const t = (now - start) / total;
      if (t >= 1) {
        if (!landed) {
          landed = true;
          card.classList.remove('flick');
          card.classList.add('winner-card');
          setFace(winner, true);
          setTimeout(resolve, 700);
        }
        return;
      }
      const ease = 1 - Math.pow(1 - t, 3);
      const interval = 70 + ease * 380;
      if (!next || now >= next) {
        setFace(list[Math.floor(Math.random() * list.length)]!, false);
        card.classList.remove('flick');
        void card.offsetWidth;
        card.classList.add('flick');
        next = now + interval;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ---- Paracaidistas ---- */
function runParacaidas(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const para = document.createElement('div');
    para.className = 'para-stage';
    para.innerHTML = `<div class="para-ground"></div><div class="para-target">🎯</div>`;
    stage.innerHTML = '';
    stage.appendChild(para);
    const chuteColors = ['#53099E', '#A17CD1', '#A3E37C', '#FFD15C', '#6B1FC7', '#FF9DA6'];

    requestAnimationFrame(() => {
      const W = para.clientWidth;
      const H = para.clientHeight;
      const targetCenterX = W / 2;
      const landingY = H - 130;

      list.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'parachute' + (i === winIdx ? ' winner-para' : '');
        const cc = chuteColors[i % chuteColors.length]!;
        el.innerHTML = `
          <svg width="82" height="60" viewBox="0 0 82 60">
            <path d="M 4 32 Q 41 -8 78 32 L 75 34 Q 41 -3 7 34 Z" fill="${cc}" stroke="#0E0520" stroke-width="1.5"/>
            <line x1="6" y1="33" x2="36" y2="56" stroke="#0E0520" stroke-width="1.3"/>
            <line x1="76" y1="33" x2="46" y2="56" stroke="#0E0520" stroke-width="1.3"/>
            <line x1="28" y1="30" x2="38" y2="56" stroke="#0E0520" stroke-width="1.3"/>
            <line x1="54" y1="30" x2="44" y2="56" stroke="#0E0520" stroke-width="1.3"/>
          </svg>
          <div class="pay">${av(p)}</div>
          <div class="nm">${esc((p.name || '').split(' ')[0]!)}</div>`;

        const startX = 50 + Math.random() * (W - 130);
        let endX: number;
        if (i === winIdx) {
          endX = targetCenterX - 40;
        } else {
          const side = i % 2 === 0 ? -1 : 1;
          const distance = 130 + Math.random() * (W / 2 - 160);
          endX = Math.max(20, Math.min(W - 100, targetCenterX - 40 + side * distance));
        }
        const delay = Math.random() * 700;
        const duration = 4400 + Math.random() * 1400;
        const sway = (Math.random() - 0.5) * 30;
        const tilt1 = (Math.random() - 0.5) * 12;
        const tilt2 = (Math.random() - 0.5) * 8;

        el.style.left = startX + 'px';
        el.style.top = '-120px';
        para.appendChild(el);

        el.animate(
          [
            { transform: `translate(0, 0) rotate(${tilt1}deg)`, opacity: 0 },
            { transform: `translate(${sway}px, 60px) rotate(${tilt2}deg)`, opacity: 1, offset: 0.08 },
            { transform: `translate(${(endX - startX) * 0.6 - sway}px, ${landingY * 0.55}px) rotate(${-tilt1}deg)`, opacity: 1, offset: 0.55 },
            { transform: `translate(${endX - startX}px, ${landingY}px) rotate(0deg)`, opacity: 1 },
          ],
          { duration, delay, easing: 'cubic-bezier(0.4, 0.05, 0.5, 1)', fill: 'forwards' },
        );
      });
    });
    setTimeout(resolve, 6000);
  });
}

/* ---- Bracket ---- */
function runBracket(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const all = list;
    const winner = all[winIdx]!;
    const N = all.length;
    const size = N <= 2 ? 2 : N <= 4 ? 4 : 8;

    type Slot = P & { __bye?: boolean };
    let entrants: Slot[];
    if (N <= size) {
      entrants = all.slice();
      while (entrants.length < size) entrants.push({ name: 'BYE', avatar: { type: 'emoji', value: '—' }, __bye: true });
    } else {
      const others = all.filter((_, i) => i !== winIdx);
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j]!, others[i]!];
      }
      entrants = others.slice(0, size - 1);
      entrants.push(winner);
    }
    for (let i = entrants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entrants[i], entrants[j]] = [entrants[j]!, entrants[i]!];
    }

    const roundsResolved: Slot[][] = [entrants.slice()];
    let alive = entrants.slice();
    let winSlot = alive.indexOf(winner);
    while (alive.length > 1) {
      const next: Slot[] = [];
      let nextWinSlot = -1;
      for (let i = 0; i < alive.length; i += 2) {
        const a = alive[i]!, b = alive[i + 1]!;
        let pickedIdx: number;
        if (i === winSlot || i + 1 === winSlot) pickedIdx = winSlot;
        else if (a.__bye && !b.__bye) pickedIdx = i + 1;
        else if (b.__bye && !a.__bye) pickedIdx = i;
        else pickedIdx = i + (Math.random() < 0.5 ? 0 : 1);
        next.push(alive[pickedIdx]!);
        if (pickedIdx === winSlot) nextWinSlot = next.length - 1;
      }
      roundsResolved.push(next);
      alive = next;
      winSlot = nextWinSlot;
    }

    const labelMap: Record<number, string[]> = { 2: ['Final'], 4: ['Semis', 'Final'], 8: ['Cuartos', 'Semis', 'Final'] };
    const roundLabels = ['Entrantes', ...labelMap[size]!];

    const renderSlot = (p?: Slot): string =>
      !p || p.__bye
        ? `<span class="av">—</span><span class="nm" style="opacity:0.4">BYE</span>`
        : `<span class="av">${av(p)}</span><span class="nm">${esc(p.name)}</span>`;

    const wrap = document.createElement('div');
    wrap.className = 'bracket-wrap';
    for (let r = 0; r < roundsResolved.length; r++) {
      const col = document.createElement('div');
      col.className = 'bracket-col';
      col.dataset.round = String(r);
      const lbl = document.createElement('div');
      lbl.className = 'round-lbl';
      lbl.textContent = roundLabels[r] || `Ronda ${r + 1}`;
      col.appendChild(lbl);

      if (r === 0) {
        for (let i = 0; i < roundsResolved[0]!.length; i += 2) {
          const match = document.createElement('div');
          match.className = 'match';
          for (let sub = 0; sub < 2; sub++) {
            const slot = document.createElement('div');
            slot.className = 'match-slot';
            slot.dataset.s = String(i + sub);
            slot.innerHTML = renderSlot(roundsResolved[0]![i + sub]);
            match.appendChild(slot);
          }
          col.appendChild(match);
        }
      } else {
        const isFinal = r === roundsResolved.length - 1;
        if (isFinal) {
          const match = document.createElement('div');
          match.className = 'match champion-match';
          const slot = document.createElement('div');
          slot.className = 'match-slot pending';
          slot.dataset.s = '0';
          slot.innerHTML = `<span class="av">🏆</span><span class="nm">¿Campeón?</span>`;
          match.appendChild(slot);
          col.appendChild(match);
        } else {
          const curLen = roundsResolved[r - 1]!.length / 2;
          for (let i = 0; i < curLen; i += 2) {
            const match = document.createElement('div');
            match.className = 'match';
            for (let sub = 0; sub < 2; sub++) {
              const slot = document.createElement('div');
              slot.className = 'match-slot pending';
              slot.dataset.s = String(i + sub);
              slot.innerHTML = `<span class="av">?</span><span class="nm">—</span>`;
              match.appendChild(slot);
            }
            col.appendChild(match);
          }
        }
      }
      wrap.appendChild(col);
    }
    stage.innerHTML = '';
    stage.appendChild(wrap);

    let curRound = 0;
    function step(): void {
      curRound++;
      if (curRound >= roundsResolved.length) {
        const champ = wrap.querySelector<HTMLElement>(`.bracket-col[data-round="${roundsResolved.length - 1}"] .match-slot`);
        if (champ) {
          champ.classList.remove('pending');
          champ.classList.add('champion');
          champ.innerHTML = renderSlot(winner);
        }
        setTimeout(resolve, 700);
        return;
      }
      const prevAlive = roundsResolved[curRound - 1]!;
      const curAlive = roundsResolved[curRound]!;
      const prevCol = wrap.querySelector(`.bracket-col[data-round="${curRound - 1}"]`)!;
      const curCol = wrap.querySelector(`.bracket-col[data-round="${curRound}"]`)!;
      for (let i = 0; i < prevAlive.length; i += 2) {
        const slotA = prevCol.querySelector(`.match-slot[data-s="${i}"]`);
        const slotB = prevCol.querySelector(`.match-slot[data-s="${i + 1}"]`);
        const matchWinner = curAlive[i / 2]!;
        if (slotA && slotB) {
          if (prevAlive[i] === matchWinner) {
            slotA.classList.add('winner');
            slotB.classList.add('loser');
          } else {
            slotB.classList.add('winner');
            slotA.classList.add('loser');
          }
        }
        const nextSlot = curCol.querySelector(`.match-slot[data-s="${i / 2}"]`);
        if (nextSlot && curRound < roundsResolved.length - 1) {
          nextSlot.classList.remove('pending');
          nextSlot.innerHTML = renderSlot(matchWinner);
        }
      }
      setTimeout(step, 1100);
    }
    setTimeout(step, 800);
  });
}

/* ---- Bola Mágica ---- */
function runBola(stage: HTMLElement, list: P[], winIdx: number): Promise<void> {
  return new Promise((resolve) => {
    const winner = list[winIdx]!;
    stage.innerHTML = `
      <div class="bola-wrap">
        <div class="bola">
          <div class="fog"></div>
          <div class="fog fog-2"></div>
          <div class="name-mist" id="bola-name">. . .</div>
        </div>
        <div class="bola-base"></div>
      </div>`;
    const nameEl = stage.querySelector<HTMLElement>('#bola-name')!;
    const start = performance.now();
    const total = 4800;
    let next = 0;
    function tick(now: number): void {
      const t = (now - start) / total;
      if (t >= 1) {
        nameEl.textContent = winner.name;
        nameEl.classList.add('revealed');
        setTimeout(resolve, 1100);
        return;
      }
      const ease = 1 - Math.pow(1 - t, 3);
      const interval = 60 + ease * 420;
      if (!next || now >= next) {
        nameEl.textContent = list[Math.floor(Math.random() * list.length)]!.name;
        next = now + interval;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ---- Confetti ---- */
export function burstConfetti(host: HTMLElement): void {
  const colors = ['#A3E37C', '#FFD15C', '#A17CD1', '#53099E', '#FFFFFF'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length]!;
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    host.appendChild(c);
    const dx = (Math.random() - 0.5) * 600;
    const dy = window.innerHeight + 100;
    const rot = Math.random() * 720;
    c.animate(
      [
        { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 2400 + Math.random() * 1600, easing: 'cubic-bezier(.2,.7,.4,1)' },
    ).onfinish = () => c.remove();
  }
}
