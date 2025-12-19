import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelColor, getLevelTier, MAX_LEVEL, getItemImage } from '../utils/constants';

const ItemDisplay = ({ level, isEnhancing, result, isDestroyed }) => {
  const color = getLevelColor(level);
  const tier = getLevelTier(level);
  const [imageError, setImageError] = useState(false);
  const itemImage = getItemImage(level);

  useEffect(() => {
    setImageError(false);
  }, [level]);

  return (
    <div className="item-container" style={{
      position: 'absolute',
      top: '42%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>

      {/* 강화 중 글로우 이펙트 */}
      {isEnhancing && (
        <>
          {/* 외곽 펄스 링 - 레벨에 따라 속도와 크기 증가 */}
          <motion.div
            animate={{
              scale: level >= 15 ? [1, 1.8, 1] : level >= 10 ? [1, 1.6, 1] : [1, 1.5, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: level >= 15 ? 0.6 : level >= 10 ? 0.8 : 1,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              width: level >= 15 ? 260 : level >= 10 ? 240 : 220,
              height: level >= 15 ? 260 : level >= 10 ? 240 : 220,
              borderRadius: '50%',
              border: `${level >= 15 ? 5 : level >= 10 ? 4 : 3}px solid ${color}`,
              boxShadow: level >= 15
                ? `0 0 50px ${color}, 0 0 100px ${color}`
                : `0 0 30px ${color}`,
            }}
          />

          {/* 내부 글로우 - 고강 시 더 강렬 */}
          <motion.div
            animate={{
              opacity: level >= 15 ? [0.5, 1, 0.5] : [0.3, 0.7, 0.3],
              scale: level >= 15 ? [0.9, 1.15, 0.9] : [0.95, 1.05, 0.95]
            }}
            transition={{
              duration: level >= 15 ? 0.5 : 0.8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: level >= 15
                ? `radial-gradient(circle, ${color}80 0%, ${color}40 40%, transparent 70%)`
                : `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            }}
          />

          {/* 회전 링 (10강 이상) - 더 화려하게 */}
          {level >= 10 && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: level >= 15 ? 1.5 : 3, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 280,
                height: 280,
                borderRadius: '50%',
                border: `${level >= 15 ? 4 : 2}px dashed ${color}`,
                boxShadow: level >= 15 ? `0 0 20px ${color}60` : 'none',
              }}
            />
          )}

          {/* 역방향 회전 링 (10강 이상) */}
          {level >= 10 && (
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: level >= 15 ? 2 : 4, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                border: `2px dotted ${color}40`,
              }}
            />
          )}

          {/* 추가 이펙트 (15강 이상) - 더 강렬한 코닉 그라데이션 */}
          {level >= 15 && (
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.2, 1] }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                scale: { duration: 0.8, repeat: Infinity }
              }}
              style={{
                position: 'absolute',
                width: 340,
                height: 340,
                borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 0%, ${color}50 25%, transparent 50%, ${color}50 75%, transparent 100%)`,
                filter: 'blur(15px)',
              }}
            />
          )}

          {/* 불꽃 이펙트 (15강 이상) */}
          {level >= 15 && (
            <>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.div
                  key={`flame-${i}`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 0.3, 0.8],
                    y: [0, -20, 0]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut'
                  }}
                  style={{
                    position: 'absolute',
                    width: 20,
                    height: 40,
                    borderRadius: '50% 50% 50% 50%',
                    background: level >= 19
                      ? `linear-gradient(to top, #ff0080, #7928ca)`
                      : `linear-gradient(to top, ${color}, #ff4500)`,
                    transform: `rotate(${angle}deg) translateY(-130px)`,
                    filter: 'blur(3px)',
                  }}
                />
              ))}
            </>
          )}

          {/* 19강 이상 무지개 오라 */}
          {level >= 19 && (
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                scale: { duration: 1, repeat: Infinity }
              }}
              style={{
                position: 'absolute',
                width: 380,
                height: 380,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #ff0080, #7928ca, #0070f3, #00d4ff, #00ff88, #ffff00, #ff8800, #ff0080)',
                opacity: 0.3,
                filter: 'blur(25px)',
              }}
            />
          )}

          {/* 전기 이펙트 (10강 이상) */}
          {level >= 10 && (
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
              style={{
                position: 'absolute',
                width: 250,
                height: 250,
                borderRadius: '50%',
                border: `2px solid ${level >= 15 ? '#fff' : color}`,
                boxShadow: `0 0 ${level >= 15 ? 40 : 20}px ${level >= 15 ? '#fff' : color}`,
                opacity: 0.5,
              }}
            />
          )}
        </>
      )}

      {/* 메인 아이템 영역 - 박스 없이 이미지 중심 */}
      <motion.div
        animate={{
          scale: isEnhancing
            ? level >= 15
              ? [1, 1.08, 0.95, 1.05, 0.97, 1.03, 1]
              : level >= 10
                ? [1, 1.05, 0.97, 1.03, 1]
                : [1, 1.03, 0.98, 1.02, 1]
            : 1,
          rotate: result === 'fail' || result === 'destroyed'
            ? level >= 15
              ? [0, -10, 10, -8, 8, -5, 5, 0]
              : [0, -5, 5, -3, 3, 0]
            : isEnhancing && level >= 15
              ? [0, -2, 2, -1, 1, 0]
              : 0,
        }}
        transition={{
          scale: {
            duration: level >= 15 ? 0.4 : level >= 10 ? 0.5 : 0.6,
            repeat: isEnhancing ? Infinity : 0
          },
          rotate: {
            duration: level >= 15 && isEnhancing ? 0.3 : 0.4,
            repeat: isEnhancing && level >= 15 ? Infinity : 0
          },
        }}
        className="item-box"
        style={{
          position: 'relative',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        {/* 내부 회전 효과 */}
        {!isDestroyed && isEnhancing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              background: `conic-gradient(from 0deg, transparent 0%, ${color}20 25%, transparent 50%, ${color}20 75%, transparent 100%)`,
            }}
          />
        )}

        {/* 강화 플래시 */}
        {isEnhancing && (
          <motion.div
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
            }}
          />
        )}

        {/* 아이템 이미지 - 큰 사이즈로 화면 채우기 */}
        <motion.div
          key={level + '-img'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            filter: isDestroyed ? 'grayscale(1) brightness(0.3)' : 'brightness(1)',
          }}
          transition={{ duration: 0.3 }}
          className="item-image"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            overflow: 'visible',
            position: 'relative',
          }}
        >
          {!imageError && !isDestroyed ? (
            <img
              src={itemImage}
              alt='item'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: `drop-shadow(0 0 20px ${color}80)`,
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="item-emoji">{isDestroyed ? '💔' : '⚔️'}</span>
          )}
          {/* 티어 뱃지 - 이미지 위에 오버레이 */}
          {!isDestroyed && (
            <motion.div
              key={tier}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                padding: '4px 10px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: level >= 15 ? '#FFF' : '#000',
                fontSize: 11,
                fontWeight: 'bold',
                zIndex: 25,
                boxShadow: `0 2px 10px ${color}80`,
              }}
            >
              {tier}
            </motion.div>
          )}
        </motion.div>

        {/* 레벨 텍스트 */}
        <motion.div
          key={level}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="item-level"
          style={{
            fontWeight: 'bold',
            color: isDestroyed ? '#444' : color,
            textShadow: isDestroyed ? 'none' : `0 0 15px ${color}, 0 0 30px ${color}`,
            zIndex: 15,
          }}
        >
          {isDestroyed ? '파괴됨' : `+${level}`}
        </motion.div>

        {/* MAX 레벨 표시 */}
        {level >= MAX_LEVEL && !isDestroyed && (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              bottom: 10,
              color: '#FFD700',
              fontSize: 12,
              fontWeight: 'bold',
              textShadow: '0 0 10px #FFD700',
              zIndex: 20,
            }}
          >
            MAX
          </motion.div>
        )}
      </motion.div>

      {/* 아이들 상태 은은한 글로우 */}
      {!isDestroyed && !isEnhancing && level > 0 && (
        <>
          <motion.div
            animate={{
              opacity: level >= 15 ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: level >= 15 ? 2 : 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              width: level >= 15 ? 260 : 220,
              height: level >= 15 ? 260 : 220,
              borderRadius: '50%',
              background: level >= 19
                ? `radial-gradient(circle, #ff008040 0%, #7928ca30 40%, transparent 70%)`
                : level >= 15
                  ? `radial-gradient(circle, ${color}40 0%, ${color}20 40%, transparent 70%)`
                  : `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
              filter: level >= 15 ? 'blur(25px)' : 'blur(20px)',
              pointerEvents: 'none',
            }}
          />

          {/* 10강 이상 회전 오라 */}
          {level >= 10 && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: level >= 15 ? 280 : 250,
                height: level >= 15 ? 280 : 250,
                borderRadius: '50%',
                border: `1px solid ${color}20`,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* 15강 이상 파티클 글로우 */}
          {level >= 15 && (
            <motion.div
              animate={{ rotate: -360, opacity: [0.2, 0.4, 0.2] }}
              transition={{
                rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 2, repeat: Infinity }
              }}
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: level >= 19
                  ? 'conic-gradient(from 0deg, transparent 0%, #ff008020 25%, transparent 50%, #7928ca20 75%, transparent 100%)'
                  : `conic-gradient(from 0deg, transparent 0%, ${color}15 25%, transparent 50%, ${color}15 75%, transparent 100%)`,
                filter: 'blur(10px)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* 19강 이상 무지개 글로우 */}
          {level >= 19 && (
            <motion.div
              animate={{ rotate: 360, opacity: [0.15, 0.25, 0.15] }}
              transition={{
                rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 3, repeat: Infinity }
              }}
              style={{
                position: 'absolute',
                width: 320,
                height: 320,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #ff008020, #7928ca20, #0070f320, #00d4ff20, #00ff8820, #ffff0020, #ff880020, #ff008020)',
                filter: 'blur(20px)',
                pointerEvents: 'none',
              }}
            />
          )}
        </>
      )}

    </div>
  );
};

export default ItemDisplay;
