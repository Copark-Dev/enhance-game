import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelColor, getLevelTier, MAX_LEVEL, getItemImage } from '../utils/constants';

const ItemDisplay = ({ level, isEnhancing, result, isDestroyed }) => {
  const color = getLevelColor(level);
  const tier = getLevelTier(level);
  const [imageError, setImageError] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
          {/* 외곽 펄스 링 */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              border: `3px solid ${color}`,
              boxShadow: `0 0 30px ${color}`,
            }}
          />

          {/* 내부 글로우 */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            }}
          />

          {/* 회전 링 (10강 이상) */}
          {level >= 10 && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 260,
                height: 260,
                borderRadius: '50%',
                border: `2px dashed ${color}60`,
              }}
            />
          )}

          {/* 추가 이펙트 (15강 이상) */}
          {level >= 15 && (
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.5, repeat: Infinity } }}
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 0%, ${color}30 25%, transparent 50%, ${color}30 75%, transparent 100%)`,
                filter: 'blur(10px)',
              }}
            />
          )}
        </>
      )}

      {/* 메인 아이템 박스 */}
      <motion.div
        animate={{
          scale: isEnhancing ? [1, 1.03, 0.98, 1.02, 1] : 1,
          rotate: result === 'fail' || result === 'destroyed' ? [0, -5, 5, -3, 3, 0] : 0,
        }}
        transition={{
          scale: { duration: 0.6, repeat: isEnhancing ? Infinity : 0 },
          rotate: { duration: 0.4 },
        }}
        className="item-box"
        style={{
          position: 'relative',
          borderRadius: 28,
          pointerEvents: 'auto',
          background: isDestroyed
            ? 'linear-gradient(145deg, #1a1a1a, #0a0a0a)'
            : 'linear-gradient(145deg, #1a1a3a, #0a0a2a)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `3px solid ${isDestroyed ? '#333' : color}`,
          boxShadow: isDestroyed
            ? 'none'
            : isEnhancing
              ? `0 0 40px ${color}, 0 0 80px ${color}66`
              : `0 0 20px ${color}`,
          overflow: 'hidden',
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

        {/* 티어 뱃지 */}
        <motion.div
          key={tier}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '5px 12px',
            borderRadius: 8,
            backgroundColor: isDestroyed ? '#333' : color,
            color: level >= 15 ? '#FFF' : '#000',
            fontSize: 13,
            fontWeight: 'bold',
            zIndex: 20,
          }}
        >
          {isDestroyed ? '파괴' : tier}
        </motion.div>

        {/* 아이템 이미지 */}
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
          onClick={() => !isDestroyed && setShowModal(true)}
          style={{
            borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            overflow: 'hidden',
            border: `2px solid ${isDestroyed ? '#222' : color}44`,
            cursor: isDestroyed ? 'default' : 'pointer',
          }}
        >
          {!imageError && !isDestroyed ? (
            <img
              src={itemImage}
              alt='item'
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="item-emoji">{isDestroyed ? '💔' : '⚔️'}</span>
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
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 이미지 확대 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                padding: 24,
                background: `linear-gradient(145deg, #1a1a3a, #0a0a2a)`,
                borderRadius: 28,
                border: `4px solid ${color}`,
                boxShadow: `0 0 80px ${color}`,
              }}
            >
              <img
                src={itemImage}
                alt='item'
                style={{
                  width: '80vmin',
                  height: '80vmin',
                  maxWidth: 600,
                  maxHeight: 600,
                  objectFit: 'contain',
                  borderRadius: 20,
                }}
              />
              <div style={{
                textAlign: 'center',
                marginTop: 20,
                color: color,
                fontSize: 36,
                fontWeight: 'bold',
                textShadow: `0 0 30px ${color}`,
              }}>
                +{level} {tier}
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: -18,
                  right: -18,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: '#222',
                  color: '#fff',
                  border: '3px solid #666',
                  fontSize: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItemDisplay;
