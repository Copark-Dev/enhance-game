import { motion, AnimatePresence } from 'framer-motion';
import { getLevelColor, getLevelTier, formatGold } from '../utils/constants';

const ResultOverlay = ({ result, level, lastSellPrice }) => {
  const color = getLevelColor(level);
  const tier = getLevelTier(level);
  
  const getContent = () => {
    if (result === 'success') {
      return {
        emoji: level >= 18 ? '👑' : level >= 15 ? '🌟' : level >= 12 ? '💎' : level >= 9 ? '🔥' : '✨',
        text: level >= 15 ? '대성공!!' : '강화 성공!',
        subText: '+' + level + ' ' + tier,
        color,
        showRainbow: level >= 15,
      };
    }
    if (result === 'fail') {
      return { emoji: '💥', text: '강화 실패...', subText: '+' + level, color: '#FF4444', showRainbow: false };
    }
    if (result === 'destroyed') {
      return { emoji: '💀', text: '파괴!!', subText: '', color: '#FF0000', showRainbow: false };
    }
    if (result === 'sold') {
      return { emoji: '💰', text: '판매 완료!', subText: '+' + formatGold(lastSellPrice) + ' G', color: '#FFD700', showRainbow: false };
    }
    return null;
  };

  const content = getContent();
  if (!content) return null;

  return (
    <AnimatePresence>
      {content && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: result === 'destroyed' ? 'rgba(50,0,0,0.9)' : result === 'sold' ? 'rgba(50,40,0,0.9)' : 'rgba(0,0,0,0.85)',
            zIndex: 1000, pointerEvents: 'none' }}>
          {content.showRainbow && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', width: 800, height: 800,
                background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #ff00ff, #ff0000)',
                opacity: 0.2, filter: 'blur(60px)' }} />
          )}
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            style={{ fontSize: 100, zIndex: 1 }}>{content.emoji}</motion.div>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 48, fontWeight: 'bold', color: content.color, textShadow: '0 0 40px ' + content.color, marginTop: 20, zIndex: 1 }}>
            {content.text}</motion.div>
          {content.subText && (
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontSize: 28, color: content.color, marginTop: 15, fontWeight: 'bold', textShadow: '0 0 20px ' + content.color, zIndex: 1 }}>
              {content.subText}</motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultOverlay;
