import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      ...S.wrap,
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.6s ease' : 'none'
    }}>
      {/* Background glow */}
      <div style={S.orb1} />
      <div style={S.orb2} />

      {/* Logo image — exact pic, no changes */}
      <div style={{
        ...S.logoWrap,
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'scale(0.85) translateY(16px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <img
          src="/logo.png"
          alt="Hemora"
          style={S.logoImg}
          onError={e => { e.target.style.display = 'none'; }}
        />

        {/* Loading bar */}
        <div style={S.barWrap}>
          <div style={{
            ...S.barFill,
            width: phase === 'hold' || phase === 'out' ? '100%' : '0%',
            transition: phase === 'hold' ? 'width 1.8s ease' : 'none'
          }} />
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: { position: 'fixed', inset: 0, background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 },
  orb1: { position: 'absolute', top: '15%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,85,0.1) 0%, transparent 70%)', pointerEvents: 'none' },
  orb2: { position: 'absolute', bottom: '15%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 },
  logoImg: { width: 320, maxWidth: '80vw', objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(255,45,85,0.3))' },
  barWrap: { width: 200, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #ff2d55, #0a84ff)', borderRadius: 2 }
};
