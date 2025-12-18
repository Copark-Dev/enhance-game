import { motion } from 'framer-motion';
import { getLevelColor, getLevelTier, MAX_LEVEL, getEffectIntensity } from '../utils/constants';
import { useImages } from '../context/ImageContext';

const ItemDisplay = ({ level, isEnhancing, result, isDestroyed }) => {
  const color = getLevelColor(level);
  const tier = getLevelTier(level);
  const intensity = getEffectIntensity(level);
  const { levelImages } = useImages();

  // 레벨별 이미지 사용
  const displayImage = levelImages[level];

  return (
    <div style={{ position: 'relative', width: 260, height: 260 }}>
      
      {/* ========== 0-5강: 기본 펄스 (1초) ========== */}
      {isEnhancing && level < 6 && (
        <>
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 180, height: 180, borderRadius: '50%',
              border: '3px solid ' + color,
              boxShadow: '0 0 20px ' + color,
            }}
          />
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 150, height: 150, borderRadius: '50%',
              background: 'radial-gradient(circle, ' + color + '44 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* ========== 6-9강: 회전 링 + 전기 (1.5초) ========== */}
      {isEnhancing && level >= 6 && level < 10 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={'ring6-' + i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 1.2 - i * 0.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 170 + i * 25, height: 170 + i * 25, borderRadius: '50%',
                border: '2px solid ' + color,
                opacity: 0.8 - i * 0.2,
                boxShadow: '0 0 15px ' + color,
              }}
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={'spark6-' + i}
              animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1, 0.5] }}
              transition={{ duration: 0.12, repeat: Infinity, repeatDelay: Math.random() * 0.4, delay: i * 0.1 }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 2, height: 40 + Math.random() * 20,
                background: 'linear-gradient(to bottom, transparent, ' + color + ', white, ' + color + ', transparent)',
                transform: 'translate(-50%, -50%) rotate(' + (i * 60) + 'deg)',
              }}
            />
          ))}
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle, ' + color + '55 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* ========== 10-14강: 다중 링 + 번개 + 파티클 (2초) ========== */}
      {isEnhancing && level >= 10 && level < 15 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={'ring10-' + i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.05, 1] }}
              transition={{ rotate: { duration: 1 - i * 0.15, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.5, repeat: Infinity } }}
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 160 + i * 30, height: 160 + i * 30, borderRadius: '50%',
                border: '2px solid ' + color,
                opacity: 0.9 - i * 0.15,
                boxShadow: '0 0 20px ' + color + ', inset 0 0 10px ' + color + '44',
              }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={'lightning10-' + i}
              animate={{ opacity: [0, 1, 0], scaleY: [0.3, 1.2, 0.3] }}
              transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 0.3, delay: i * 0.08 }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 3, height: 60 + Math.random() * 30,
                background: 'linear-gradient(to bottom, transparent, ' + color + ', #fff, ' + color + ', transparent)',
                transform: 'translate(-50%, -50%) rotate(' + (i * 45 + Math.random() * 20) + 'deg)',
                filter: 'blur(1px)',
                boxShadow: '0 0 10px ' + color,
              }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={'particle10-' + i}
              animate={{ y: [0, -60], x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50], opacity: [1, 0], scale: [1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
              style={{
                position: 'absolute', bottom: '35%', left: '50%',
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? color : '#fff',
                boxShadow: '0 0 8px ' + color,
              }}
            />
          ))}
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 140, height: 140, borderRadius: '50%',
              background: 'radial-gradient(circle, ' + color + '66 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* ========== 15-18강: 오라 + 화염 + 회전 광선 (3초) ========== */}
      {isEnhancing && level >= 15 && level < 19 && (
        <>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.15, 1] }}
            transition={{ rotate: { duration: 2, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.8, repeat: Infinity } }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 280, height: 280, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, ' + color + '00, ' + color + '88, ' + color + '00, ' + color + '88, ' + color + '00)',
              filter: 'blur(8px)',
            }}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={'ring15-' + i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 1.5 - i * 0.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 150 + i * 25, height: 150 + i * 25, borderRadius: '50%',
                border: '2px solid ' + color,
                opacity: 0.9 - i * 0.12,
                boxShadow: '0 0 25px ' + color,
              }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 300 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={'beam15-' + i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 4, height: 150,
                  background: 'linear-gradient(to top, ' + color + ', #fff, transparent)',
                  transformOrigin: 'bottom center',
                  transform: 'translate(-50%, -100%) rotate(' + (i * 90) + 'deg)',
                  boxShadow: '0 0 15px ' + color,
                }}
              />
            ))}
          </motion.div>
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={'flame15-' + i}
              animate={{ y: [0, -80 - Math.random() * 40], x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 60], opacity: [1, 0], scale: [1, 0.3] }}
              transition={{ duration: 0.7 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }}
              style={{
                position: 'absolute', bottom: '30%', left: '50%',
                width: 8 + Math.random() * 6, height: 8 + Math.random() * 6, borderRadius: '50%',
                backgroundColor: ['#FF4500', '#FF6600', '#FF8C00', '#FFD700', '#fff'][i % 5],
                boxShadow: '0 0 12px ' + color,
              }}
            />
          ))}
          <motion.div
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* ========== 19-20강: 무지개 폭발 + 극한 이펙트 (5초) ========== */}
      {isEnhancing && level >= 19 && (
        <>
          <motion.div
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ rotate: { duration: 2.5, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.6, repeat: Infinity } }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 340, height: 340, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #ff00ff, #ff0000)',
              opacity: 0.7,
              filter: 'blur(15px)',
            }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 300, height: 300, borderRadius: '50%',
              background: 'conic-gradient(from 180deg, #ff00ff, #0088ff, #00ffff, #00ff00, #ffff00, #ff8800, #ff0000, #ff00ff)',
              opacity: 0.5,
              filter: 'blur(10px)',
            }}
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={'ring19-' + i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.08, 1] }}
              transition={{ rotate: { duration: 1.2 - i * 0.12, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.4, repeat: Infinity } }}
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 140 + i * 25, height: 140 + i * 25, borderRadius: '50%',
                border: '3px solid ' + ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'][i],
                boxShadow: '0 0 20px ' + ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'][i],
              }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400 }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <motion.div
                key={'beam19-' + i}
                animate={{ opacity: [0.5, 1, 0.5], scaleY: [0.8, 1.1, 0.8] }}
                transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 5, height: 200,
                  background: 'linear-gradient(to top, ' + ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#ff00ff', '#fff'][i] + ', #fff, transparent)',
                  transformOrigin: 'bottom center',
                  transform: 'translate(-50%, -100%) rotate(' + (i * 45) + 'deg)',
                  boxShadow: '0 0 20px ' + ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#ff00ff', '#fff'][i],
                }}
              />
            ))}
          </motion.div>
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={'mega19-' + i}
              animate={{
                y: [0, -100 - Math.random() * 60],
                x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 120],
                opacity: [1, 0],
                scale: [1, 0.2],
                rotate: [0, 360],
              }}
              transition={{ duration: 0.9 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.06 }}
              style={{
                position: 'absolute', bottom: '30%', left: '50%',
                width: 10 + Math.random() * 8, height: 10 + Math.random() * 8,
                borderRadius: i % 3 === 0 ? '50%' : '3px',
                backgroundColor: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#ff00ff', '#fff'][i % 8],
                boxShadow: '0 0 15px currentColor',
              }}
            />
          ))}
          <motion.div
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.25, repeat: Infinity }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 180, height: 180, borderRadius: '50%',
              background: 'radial-gradient(circle, #fff 0%, #fff8 30%, transparent 70%)',
            }}
          />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'fixed', inset: 0, pointerEvents: 'none',
              boxShadow: 'inset 0 0 100px 30px rgba(255, 100, 0, 0.3)',
              zIndex: 5,
            }}
          />
        </>
      )}

      {/* ========== 메인 아이템 박스 ========== */}
      <motion.div
        animate={{
          scale: isEnhancing ? (level >= 19 ? [1, 1.08, 0.95, 1.06, 0.97, 1.04, 1] : level >= 15 ? [1, 1.06, 0.97, 1.04, 1] : [1, 1.04, 0.98, 1.02, 1]) : 1,
          rotate: result === 'fail' || result === 'destroyed' ? [0, -10, 10, -8, 8, -5, 5, 0] : 0,
        }}
        transition={{
          scale: { duration: level >= 19 ? 0.5 : level >= 15 ? 0.4 : 0.3, repeat: isEnhancing ? Infinity : 0 },
          rotate: { duration: 0.5 },
        }}
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 180, height: 180, borderRadius: 20,
          background: isDestroyed ? 'linear-gradient(145deg, #1a1a1a, #0a0a0a)' : 'linear-gradient(145deg, #1a1a3a, #0a0a2a)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '3px solid ' + (isDestroyed ? '#333' : color),
          boxShadow: isDestroyed ? 'none' : isEnhancing
            ? '0 0 ' + (40 + level * 3) + 'px ' + color + ', 0 0 ' + (80 + level * 5) + 'px ' + color + '88'
            : '0 0 ' + (15 + level * 2) + 'px ' + color,
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {!isDestroyed && isEnhancing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: level >= 15 ? 1 : 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', width: 250, height: 250,
              background: 'conic-gradient(from 0deg, transparent 0%, ' + color + '33 25%, transparent 50%, ' + color + '33 75%, transparent 100%)',
            }}
          />
        )}

        {isEnhancing && (
          <motion.div
            animate={{ opacity: level >= 19 ? [0, 0.8, 0] : level >= 15 ? [0, 0.6, 0] : [0, 0.4, 0] }}
            transition={{ duration: level >= 15 ? 0.2 : 0.3, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />
        )}

        <motion.div
          key={tier}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          style={{
            position: 'absolute', top: 8, right: 8, padding: '4px 10px', borderRadius: 8,
            backgroundColor: isDestroyed ? '#333' : color,
            color: level >= 15 ? '#FFF' : '#000',
            fontSize: 12, fontWeight: 'bold', zIndex: 20,
          }}
        >
          {isDestroyed ? '파괴' : tier}
        </motion.div>

        <motion.div
          key={level + '-img'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: isEnhancing ? [1, 1.1, 1] : 1,
            opacity: 1,
            filter: isEnhancing 
              ? (level >= 19 ? ['brightness(1)', 'brightness(4)', 'brightness(1)'] : level >= 15 ? ['brightness(1)', 'brightness(3)', 'brightness(1)'] : ['brightness(1)', 'brightness(2)', 'brightness(1)'])
              : isDestroyed ? 'grayscale(1) brightness(0.3)' : 'brightness(1)',
          }}
          transition={{ duration: level >= 15 ? 0.2 : 0.3, repeat: isEnhancing ? Infinity : 0 }}
          style={{
            width: 80, height: 80, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 15, overflow: 'hidden', border: '2px solid ' + (isDestroyed ? '#222' : color) + '44',
          }}
        >
          {displayImage ? (
            <img src={displayImage} alt='item' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 45 }}>{isDestroyed ? '💔' : '⚔️'}</span>
          )}
        </motion.div>

        <motion.div
          key={level}
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 8 }}
          style={{
            fontSize: 28, fontWeight: 'bold',
            color: isDestroyed ? '#444' : color,
            textShadow: isDestroyed ? 'none' : '0 0 15px ' + color + ', 0 0 30px ' + color,
            marginTop: 6, zIndex: 15,
          }}
        >
          {isDestroyed ? '파괴됨' : '+' + level}
        </motion.div>

        {level >= MAX_LEVEL && !isDestroyed && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ position: 'absolute', bottom: 8, color: '#FFD700', fontSize: 11, fontWeight: 'bold', textShadow: '0 0 10px #FFD700', zIndex: 20 }}
          >
            ✨ PERFECT ✨
          </motion.div>
        )}
      </motion.div>

      {!isDestroyed && !isEnhancing && level >= 15 && (
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 220, height: 220, borderRadius: '50%',
            background: level >= 19
              ? 'conic-gradient(from 0deg, #ff000033, #ff880033, #ffff0033, #00ff0033, #00ffff33, #0088ff33, #ff00ff33, #ff000033)'
              : 'conic-gradient(from 0deg, ' + color + '22, transparent, ' + color + '22, transparent)',
            filter: 'blur(15px)',
          }}
        />
      )}
    </div>
  );
};

export default ItemDisplay;
