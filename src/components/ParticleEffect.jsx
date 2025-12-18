import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticleEffect = ({ trigger, type = 'success', level = 0 }) => {
  const [effects, setEffects] = useState({ particles: [], rings: [], beams: [], flash: false, shockwave: false });

  useEffect(() => {
    if (!trigger) return;

    const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#ff00ff'];
    const successColors = level >= 19 ? [...rainbowColors, '#fff'] : level >= 15 ? ['#FF4500', '#FF6600', '#FFD700', '#FFF'] : ['#FFD700', '#FFA500', '#FFFF00', '#FFF'];
    const failColors = ['#FF4444', '#FF6666', '#CC3333'];
    const destroyColors = ['#FF0000', '#CC0000', '#FF4400', '#000'];

    const colors = type === 'success' ? successColors : type === 'destroyed' ? destroyColors : failColors;

    // 파티클
    const particleCount = type === 'destroyed' ? 80 : level >= 19 ? 60 : level >= 15 ? 45 : level >= 10 ? 35 : 25;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      id: 'p-' + Date.now() + '-' + i,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.25,
      size: level >= 19 ? 8 + Math.random() * 10 : level >= 15 ? 6 + Math.random() * 8 : 5 + Math.random() * 6,
      distance: level >= 19 ? 180 + Math.random() * 120 : level >= 15 ? 150 + Math.random() * 100 : 100 + Math.random() * 80,
      duration: 0.8 + Math.random() * 0.4,
      angle: (i / particleCount) * 360 + Math.random() * 15,
    }));

    // 링 (6강+)
    const ringCount = level >= 19 ? 6 : level >= 15 ? 5 : level >= 10 ? 4 : level >= 6 ? 3 : 0;
    const rings = Array.from({ length: ringCount }, (_, i) => ({
      id: 'r-' + Date.now() + '-' + i,
      color: level >= 19 ? rainbowColors[i % 7] : colors[i % colors.length],
      delay: i * 0.06,
      scale: 2 + i * 0.4,
    }));

    // 빔 (10강+)
    const beamCount = level >= 19 ? 12 : level >= 15 ? 8 : level >= 10 ? 6 : 0;
    const beams = Array.from({ length: beamCount }, (_, i) => ({
      id: 'b-' + Date.now() + '-' + i,
      color: level >= 19 ? rainbowColors[i % 7] : colors[i % colors.length],
      angle: (i / beamCount) * 360,
      delay: i * 0.03,
      length: level >= 19 ? 250 : level >= 15 ? 200 : 150,
    }));

    const flash = type === 'success' || type === 'destroyed';
    const shockwave = type === 'success' && level >= 10;

    setEffects({ particles, rings, beams, flash, shockwave });

    setTimeout(() => setEffects({ particles: [], rings: [], beams: [], flash: false, shockwave: false }), 2500);
  }, [trigger, type, level]);

  return (
    <>
      {/* 화면 플래시 */}
      <AnimatePresence>
        {effects.flash && (
          <motion.div
            initial={{ opacity: level >= 19 ? 1 : level >= 15 ? 0.9 : 0.7 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: level >= 15 ? 0.5 : 0.35 }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: type === 'destroyed' ? '#FF0000' : '#FFFFFF',
              zIndex: 50, pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* 충격파 */}
      <AnimatePresence>
        {effects.shockwave && (
          <>
            <motion.div
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: level >= 19 ? 5 : level >= 15 ? 4 : 3, opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 80, height: 80, borderRadius: '50%',
                border: level >= 19 ? '5px solid #fff' : '4px solid #FFD700',
                boxShadow: '0 0 30px ' + (level >= 19 ? '#fff' : '#FFD700'),
                zIndex: 60,
              }}
            />
            {level >= 15 && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0.8 }}
                animate={{ scale: level >= 19 ? 6 : 4.5, opacity: 0 }}
                transition={{ duration: 0.9, delay: 0.1 }}
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 80, height: 80, borderRadius: '50%',
                  background: level >= 19 ? 'conic-gradient(#ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #ff00ff, #ff0000)' : 'radial-gradient(#FFD700, #FF4500)',
                  filter: 'blur(8px)',
                  zIndex: 59,
                }}
              />
            )}
          </>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 100 }}>
        <AnimatePresence>
          {/* 링 */}
          {effects.rings.map((r) => (
            <motion.div
              key={r.id}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: r.scale, opacity: 0 }}
              transition={{ duration: 0.6, delay: r.delay }}
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 90, height: 90, borderRadius: '50%',
                border: '3px solid ' + r.color,
                boxShadow: '0 0 20px ' + r.color,
              }}
            />
          ))}

          {/* 빔 */}
          {effects.beams.map((b) => (
            <motion.div
              key={b.id}
              initial={{ scaleY: 0, opacity: 1 }}
              animate={{ scaleY: 1, opacity: 0 }}
              transition={{ duration: 0.35, delay: b.delay }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                width: level >= 19 ? 5 : 4, height: b.length,
                background: 'linear-gradient(to top, ' + b.color + ', #fff, transparent)',
                transformOrigin: 'bottom center',
                transform: 'translate(-50%, -100%) rotate(' + b.angle + 'deg)',
                boxShadow: '0 0 12px ' + b.color,
              }}
            />
          ))}

          {/* 파티클 */}
          {effects.particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos(p.angle * Math.PI / 180) * p.distance,
                y: Math.sin(p.angle * Math.PI / 180) * p.distance - 15,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: p.duration, delay: p.delay }}
              style={{
                position: 'absolute',
                width: p.size, height: p.size,
                borderRadius: Math.random() > 0.4 ? '50%' : '2px',
                backgroundColor: p.color,
                boxShadow: '0 0 ' + (p.size * 1.5) + 'px ' + p.color,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ParticleEffect;
