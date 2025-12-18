import { createContext, useContext, useState, useEffect } from 'react';

const ImageContext = createContext();

export const useImages = () => useContext(ImageContext);

// 이미지 압축 함수
const compressImage = (base64, maxWidth = 200, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
  });
};

export const ImageProvider = ({ children }) => {
  const [levelImages, setLevelImages] = useState(() => {
    try {
      const saved = localStorage.getItem('levelImages');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('levelImages', JSON.stringify(levelImages));
    } catch (e) {
      console.warn('localStorage 용량 초과, 일부 이미지 삭제됨');
      // 용량 초과시 가장 오래된 이미지부터 삭제
      const keys = Object.keys(levelImages);
      if (keys.length > 0) {
        const newImages = { ...levelImages };
        delete newImages[keys[0]];
        setLevelImages(newImages);
      }
    }
  }, [levelImages]);

  const setImageForLevel = async (level, imageData) => {
    // 이미지 압축 후 저장
    const compressed = await compressImage(imageData);
    setLevelImages(prev => ({ ...prev, [level]: compressed }));
  };

  const removeImageForLevel = (level) => {
    setLevelImages(prev => {
      const newImages = { ...prev };
      delete newImages[level];
      return newImages;
    });
  };

  const clearAllImages = () => {
    setLevelImages({});
    localStorage.removeItem('levelImages');
  };

  return (
    <ImageContext.Provider value={{ levelImages, setImageForLevel, removeImageForLevel, clearAllImages }}>
      {children}
    </ImageContext.Provider>
  );
};
