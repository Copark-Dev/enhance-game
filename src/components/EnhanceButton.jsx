import { motion } from 'framer-motion';

const EnhanceButton = ({ onClick, disabled, isEnhancing, isMax, level = 0 }) => {
  const getButtonText = () => {
    if (isEnhancing) {
      if (level >= 15) return '🔥 강화 중... 🔥';
      if (level >= 10) return '⚡ 강화 중... ⚡';
      return '강화 중...';
    }
    if (isMax) return '🏆 MAX 달성!';
    if (level >= 15) return '🔥 도전하기 🔥';
    if (level >= 10) return '⚡ 강화하기 ⚡';
    return '🔥 강화하기';
  };

  // 레벨별 색상
  const getGradient = () => {
    if (disabled) return 'linear-gradient(145deg, #555, #333)';
    if (level >= 19) return 'linear-gradient(145deg, #ff0080, #7928ca, #ff0080)';
    if (level >= 15) return 'linear-gradient(145deg, #ff4500, #ff0000)';
    if (level >= 10) return 'linear-gradient(145deg, #ff6b00, #ff4500)';
    return 'linear-gradient(145deg, #ff6b00, #ff4500)';
  };

  // 레벨별 글로우 효과
  const getGlow = () => {
    if (disabled || isEnhancing) return '0 0 5px rgba(0,0,0,0.3)';
    if (level >= 19) return [
      '0 0 20px #ff0080, 0 0 40px #7928ca, 0 0 60px #ff0080',
      '0 0 40px #7928ca, 0 0 80px #ff0080, 0 0 100px #7928ca',
      '0 0 20px #ff0080, 0 0 40px #7928ca, 0 0 60px #ff0080'
    ];
    if (level >= 15) return [
      '0 0 15px #ff4500, 0 0 30px #ff0000',
      '0 0 30px #ff0000, 0 0 60px #ff4500',
      '0 0 15px #ff4500, 0 0 30px #ff0000'
    ];
    if (level >= 10) return [
      '0 0 10px #ff6b00, 0 0 20px #ff4500',
      '0 0 20px #ff4500, 0 0 40px #ff6b00',
      '0 0 10px #ff6b00, 0 0 20px #ff4500'
    ];
    return [
      '0 0 10px #ff6b00, 0 0 20px #ff6b00',
      '0 0 20px #ff6b00, 0 0 40px #ff6b00',
      '0 0 10px #ff6b00, 0 0 20px #ff6b00'
    ];
  };

  // 강화 중 애니메이션
  const enhancingAnimation = isEnhancing ? {
    scale: level >= 15 ? [1, 1.08, 1, 1.08, 1] : level >= 10 ? [1, 1.05, 1, 1.05, 1] : [1, 1.03, 1],
    rotate: level >= 15 ? [0, -2, 2, -2, 0] : 0,
  } : {};

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={{
        boxShadow: getGlow(),
        ...enhancingAnimation,
      }}
      transition={{
        boxShadow: { duration: level >= 15 ? 0.8 : 1.5, repeat: Infinity },
        scale: { duration: level >= 15 ? 0.3 : 0.5, repeat: isEnhancing ? Infinity : 0 },
        rotate: { duration: 0.2, repeat: isEnhancing ? Infinity : 0 },
      }}
      style={{
        padding: level >= 15 ? '20px 65px' : '18px 60px',
        fontSize: level >= 15 ? 22 : 20,
        fontWeight: 'bold',
        color: '#FFF',
        background: getGradient(),
        backgroundSize: level >= 19 ? '200% 200%' : '100% 100%',
        border: level >= 15 ? '2px solid rgba(255,255,255,0.3)' : 'none',
        borderRadius: 30,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
        textShadow: level >= 10 ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
      }}
    >
      {getButtonText()}
    </motion.button>
  );
};

export default EnhanceButton;
