import type { Avatar as AvatarT, CreateParticipantInput, Participant } from '@sortea2/shared';
import { useRef, useState } from 'react';
import { EMOJIS } from '../raffle/modes';
import { Avatar } from './Avatar';

const DEFAULT_AVATAR: AvatarT = { type: 'emoji', value: '🦄' };

/** Reduce/recorta la foto a un cuadrado 160px para no enviar megabytes. */
function fileToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d')!;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function RegisterView({
  register,
  locked,
}: {
  register: (input: CreateParticipantInput) => Promise<Participant>;
  locked: boolean;
}) {
  const [tab, setTab] = useState<'emoji' | 'photo'>('emoji');
  const [avatar, setAvatar] = useState<AvatarT>(DEFAULT_AVATAR);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Participant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email);

  const reset = () => {
    setTab('emoji');
    setAvatar(DEFAULT_AVATAR);
    setName('');
    setEmail('');
    setPhone('');
    setSuccess(null);
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setAvatar({ type: 'photo', value: await fileToSquareDataUrl(file) });
  };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const p = await register({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, avatar });
      setSuccess(p);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo registrar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="stage">
      <div className="register-wrap">
        <div className="register-side">
          <span className="eyebrow-inline">— Cómo se ve para tus asistentes</span>
          <h1 style={{ marginTop: 16 }}>
            Registro <span className="accent">en 30 segundos</span> desde el celular.
          </h1>
          <p>
            Esta es la pantalla que ven los asistentes después de escanear el QR. Eligen un avatar
            (emoji o foto), escriben sus datos y entran automáticamente al sorteo.
          </p>
          <div className="meta-list">
            <div className="row"><div className="step">01</div><div className="label"><strong>Avatar</strong> — emoji rápido o foto para reconocerse en pantalla.</div></div>
            <div className="row"><div className="step">02</div><div className="label"><strong>Nombre</strong> — como quiere aparecer en la pantalla del sorteo.</div></div>
            <div className="row"><div className="step">03</div><div className="label"><strong>Correo</strong> — para contactar al ganador.</div></div>
            <div className="row"><div className="step">04</div><div className="label"><strong>Teléfono</strong> <span className="hint">(opcional)</span></div></div>
          </div>
        </div>

        <div className="phone">
          <div className="phone-screen">
            <div className="phone-status">
              <span>9:41</span>
              <span className="right"><span>5G</span><span>●●●</span><span>▮▮▮</span></span>
            </div>

            {success ? (
              <div className="success-screen">
                <div className="check">✓</div>
                <div className="big-emoji"><Avatar avatar={success.avatar} /></div>
                <h2>¡Listo, {success.name.split(' ')[0]}!</h2>
                <p>Estás dentro del sorteo. Atento a la pantalla en cualquier momento.</p>
                <div className="num-id">ID · {String(success.number).padStart(4, '0')}</div>
                <button className="btn-again" onClick={reset}>Registrar a otra persona</button>
              </div>
            ) : locked ? (
              <div className="success-screen">
                <div className="big-emoji">🔒</div>
                <h2>Registro cerrado</h2>
                <p>El sorteo ya inició, así que las inscripciones se cerraron. ¡Mucha suerte a los participantes!</p>
              </div>
            ) : (
              <div className="phone-body">
                <div className="phone-head"><span className="dot" /> Sorteo en vivo · Lima 2026</div>
                <h2 className="phone-h1">Únete al <span className="accent">sorteo</span></h2>
                <p className="phone-sub">Registra tus datos. El ganador se anuncia en pantalla.</p>

                <div className="avatar-block">
                  <div className="avatar-block-head">
                    <span className="lbl">01 · Avatar</span>
                    <div className="tab-row">
                      <button className={`tab${tab === 'emoji' ? ' on' : ''}`} onClick={() => setTab('emoji')}>Emoji</button>
                      <button className={`tab${tab === 'photo' ? ' on' : ''}`} onClick={() => setTab('photo')}>Foto</button>
                    </div>
                  </div>
                  {tab === 'emoji' ? (
                    <div className="emoji-grid">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          className={`emoji-pick${avatar.type === 'emoji' && avatar.value === e ? ' on' : ''}`}
                          onClick={() => setAvatar({ type: 'emoji', value: e })}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <label className={`upload-box${avatar.type === 'photo' ? ' has-image' : ''}`}>
                      {avatar.type === 'photo' ? (
                        <img src={avatar.value} alt="" />
                      ) : (
                        <>
                          <span className="up-ico">📷</span>
                          <span className="up-lbl">Tomar / subir foto</span>
                        </>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => onPhoto(e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>

                <div className="field">
                  <label>02 · Nombre</label>
                  <input type="text" placeholder="Ada Lovelace" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label>03 · Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                <div className="field">
                  <label>04 · Teléfono <span className="opt">opcional</span></label>
                  <input type="tel" placeholder="+51 999 888 777" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                {formError && <div className="form-error">⚠ {formError}</div>}

                <button className="phone-submit" disabled={!valid || submitting} onClick={submit}>
                  {submitting ? 'Registrando…' : 'Registrarme al sorteo'}
                </button>
                <div className="phone-foot">DevOpsDays Lima · Términos del sorteo</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
