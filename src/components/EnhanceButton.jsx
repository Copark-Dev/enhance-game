import { motion } from 'framer-motion';

const EnhanceButton = ({ onClick, disabled, isEnhancing, isMax }) => {
  const getButtonText = () => isEnhancing ? '강화 중...' : isMax ? '🏆 MAX 달성!' : '🔥 강화하기';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={{ boxShadow: !disabled && !isEnhancing ? ['0 0 10px #ff6b00, 0 0 20px #ff6b00', '0 0 20px #ff6b00, 0 0 40px #ff6b00', '0 0 10px #ff6b00, 0 0 20px #ff6b00'] : '0 0 5px rgba(0,0,0,0.3)' }}
      transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
      style={{
        padding: '18px 60px', fontSize: 20, fontWeight: 'bold', color: '#FFF',
        background: disabled ? 'linear-gradient(145deg, #555, #333)' : 'linear-gradient(145deg, #ff6b00, #ff4500)',
        border: 'none', borderRadius: 30, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, outline: 'none',
      }}
    >
      {getButtonText()}
    </motion.button>
  );
};

export default EnhanceButton;
