import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useImages } from '../context/ImageContext';
import { getLevelColor, getLevelTier } from '../utils/constants';

const AdminPage = () => {
  const navigate = useNavigate();
  const { levelImages, setImageForLevel, removeImageForLevel, clearAllImages } = useImages();
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleImageUpload = (level, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageForLevel(level, event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const levels = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.h1 style={styles.title} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          ⚙️ 어드민 페이지
        </motion.h1>
        <div style={styles.headerButtons}>
          <motion.button
            onClick={clearAllImages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.clearBtn}
          >
            🗑️ 전체 삭제
          </motion.button>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.backBtn}
          >
            🎮 게임으로
          </motion.button>
        </div>
      </div>

      <div style={styles.statsBar}>
        <span>📷 등록된 이미지: {Object.keys(levelImages).length} / 21</span>
      </div>

      <div style={styles.grid}>
        {levels.map((level) => {
          const color = getLevelColor(level);
          const tier = getLevelTier(level);
          const hasImage = !!levelImages[level];

          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: level * 0.03 }}
              style={{
                ...styles.card,
                borderColor: hasImage ? color : '#333',
                boxShadow: hasImage ? '0 0 15px ' + color + '44' : 'none',
              }}
            >
              <div style={styles.cardHeader}>
                <span style={{ ...styles.levelBadge, backgroundColor: color, color: level >= 15 ? '#fff' : '#000' }}>
                  +{level}
                </span>
                <span style={{ ...styles.tierLabel, color }}>{tier}</span>
              </div>

              <div style={styles.imageArea}>
                {hasImage ? (
                  <img src={levelImages[level]} alt={'level ' + level} style={styles.previewImage} />
                ) : (
                  <div style={styles.placeholder}>
                    <span style={{ fontSize: 30 }}>📷</span>
                    <span style={{ fontSize: 12, color: '#666' }}>이미지 없음</span>
                  </div>
                )}
              </div>

              <div style={styles.cardActions}>
                <label style={styles.uploadLabel}>
                  {hasImage ? '변경' : '업로드'}
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleImageUpload(level, e)}
                    style={{ display: 'none' }}
                  />
                </label>
                {hasImage && (
                  <button onClick={() => removeImageForLevel(level)} style={styles.removeBtn}>
                    삭제
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #0a0a1a 100%)',
    padding: 20,
    fontFamily: 'Noto Sans KR, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 15,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    margin: 0,
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
  },
  headerButtons: {
    display: 'flex',
    gap: 10,
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearBtn: {
    padding: '10px 20px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsBar: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: '12px 20px',
    borderRadius: 10,
    color: '#aaa',
    marginBottom: 20,
    fontSize: 14,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 15,
  },
  card: {
    backgroundColor: 'rgba(20,20,40,0.9)',
    borderRadius: 12,
    padding: 12,
    border: '2px solid #333',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  levelBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageArea: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    width: '100%',
  },
  uploadLabel: {
    flex: 1,
    padding: '8px 0',
    backgroundColor: '#2196F3',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  removeBtn: {
    padding: '8px 12px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
  },
};

export default AdminPage;
