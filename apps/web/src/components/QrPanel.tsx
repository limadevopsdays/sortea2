import { useMemo, useState } from 'react';
import isotipoMorado from '../assets/isotipo-morado.svg';
import { env } from '../lib/env';
import { buildBrandedQrSvg } from '../lib/qr';

/** Panel del QR de registro (paso 01). Apunta a la URL pública + #register. */
export function QrPanel({ onOpenForm }: { onOpenForm: () => void }) {
  const url = useMemo(() => `${env.publicUrl}/#register`, []);
  const svg = useMemo(() => buildBrandedQrSvg(url, isotipoMorado), [url]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside className="qr-panel">
      <div className="qr-head">
        <span>QR de Registro</span>
        <span className="step-num">PASO 01</span>
      </div>
      <h3 className="qr-title">
        Escanéa <span className="accent">y participa</span>
      </h3>
      <p className="qr-sub">
        Los asistentes apuntan su cámara al QR para entrar al sorteo. Cada registro aparece aquí en
        tiempo real.
      </p>

      <div className="qr-frame">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="qr-caption">
          Escanea con tu celular · <b>devopsdays.pe</b>
        </div>
      </div>

      <div className="qr-url">{url.replace(/^https?:\/\//, '')}</div>

      <div className="qr-actions">
        <button className="btn-ghost" onClick={copy}>
          {copied ? '✓ Copiado' : '📋 Copiar enlace'}
        </button>
        <button className="btn-ghost" onClick={onOpenForm}>
          ↗ Abrir form
        </button>
      </div>
    </aside>
  );
}
