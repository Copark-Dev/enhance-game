import { motion, AnimatePresence } from 'framer-motion';

const GuidePanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const events = [
    { icon: '⚡', name: '럭키 강화', desc: '강화 성공 시 5% 확률로 +2 상승', color: '#FFD700' },
    { icon: '💰', name: '황금 찬스', desc: '판매 시 10% 확률로 2~5배 가격', color: '#FFD700' },
    { icon: '🛡️', name: '보호막', desc: '파괴 후 20% 확률로 획득, 다음 파괴 방지', color: '#4CAF50' },
    { icon: '🎁', name: '무료 강화권', desc: '판매 후 15% 확률로 획득', color: '#9C27B0' },
    { icon: '🔥', name: '열정 모드', desc: '연속 3회 실패 시 발동, 성공률 2배', color: '#FF5722' },
    { icon: '🌟', name: '축복', desc: '성공 시 5% 확률로 획득, 다음 하락 방지', color: '#E91E63' },
    { icon: '💎', name: '잭팟', desc: '노가다 클릭 시 0.1% 확률로 +10,000G', color: '#00BCD4' },
  ];

  const mechanics = [
    { label: '하락', desc: '5강부터 실패 시 레벨 하락 가능 (30%~98%)' },
    { label: '파괴', desc: '8강부터 실패 시 장비 파괴 가능 (3%~95%)' },
    { label: '보관함', desc: '현재 장비를 보관하고 새로 시작 (최대 5개)' },
    { label: '친구', desc: '닉네임 검색으로 친구 추가, 골드 선물 가능' },
  ];

  const tiers = [
    { range: '0~2강', name: '일반', color: '#AAAAAA' },
    { range: '3~5강', name: '고급', color: '#4CAF50' },
    { range: '6~8강', name: '희귀', color: '#2196F3' },
    { range: '9~11강', name: '영웅', color: '#9C27B0' },
    { range: '12~14강', name: '전설', color: '#FF9800' },
    { range: '15~17강', name: '신화', color: '#F44336' },
    { range: '18~20강', name: '초월', color: '#E91E63' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={styles.overlay}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={styles.modal}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>📖 게임 가이드</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          {/* 이벤트 섹션 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🎲 랜덤 이벤트</h3>
            <div style={styles.eventList}>
              {events.map((event, i) => (
                <div key={i} style={styles.eventItem}>
                  <span style={{ ...styles.eventIcon, backgroundColor: `${event.color}30`, borderColor: event.color }}>
                    {event.icon}
                  </span>
                  <div style={styles.eventInfo}>
                    <div style={{ ...styles.eventName, color: event.color }}>{event.name}</div>
                    <div style={styles.eventDesc}>{event.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 게임 메카닉 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>⚙️ 게임 시스템</h3>
            <div style={styles.mechanicList}>
              {mechanics.map((m, i) => (
                <div key={i} style={styles.mechanicItem}>
                  <span style={styles.mechanicLabel}>{m.label}</span>
                  <span style={styles.mechanicDesc}>{m.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 등급 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏆 장비 등급</h3>
            <div style={styles.tierList}>
              {tiers.map((tier, i) => (
                <div key={i} style={styles.tierItem}>
                  <span style={{ ...styles.tierBadge, backgroundColor: tier.color }}>{tier.name}</span>
                  <span style={styles.tierRange}>{tier.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 팁 */}
          <div style={styles.tipBox}>
            <div style={styles.tipTitle}>💡 팁</div>
            <ul style={styles.tipList}>
              <li>보호막이 있을 때 고위험 강화 시도!</li>
              <li>열정 모드(🔥)가 뜨면 바로 강화!</li>
              <li>황금 찬스(💰)를 노려 판매 타이밍 조절</li>
              <li>높은 강화는 보관 후 새로 도전</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 15,
  },
  modal: {
    backgroundColor: 'rgba(20,20,40,0.98)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85vh',
    overflowY: 'auto',
    border: '2px solid #FFD700',
    boxShadow: '0 0 40px rgba(255,215,0,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { margin: 0, color: '#FFD700', fontSize: 20 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 24,
    cursor: 'pointer',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #333',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    border: '1px solid',
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  eventDesc: {
    color: '#999',
    fontSize: 11,
  },
  mechanicList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  mechanicItem: {
    display: 'flex',
    gap: 10,
    fontSize: 12,
    padding: '6px 0',
  },
  mechanicLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    minWidth: 50,
  },
  mechanicDesc: {
    color: '#aaa',
  },
  tierList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  tierBadge: {
    padding: '2px 8px',
    borderRadius: 4,
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tierRange: {
    color: '#888',
    fontSize: 11,
  },
  tipBox: {
    padding: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 10,
    border: '1px solid rgba(255,215,0,0.3)',
  },
  tipTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 8,
  },
  tipList: {
    margin: 0,
    paddingLeft: 18,
    color: '#ccc',
    fontSize: 12,
    lineHeight: 1.8,
  },
};

export default GuidePanel;
