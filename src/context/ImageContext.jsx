import { createContext, useContext, useState, useEffect } from 'react';

const ImageContext = createContext();

export const useImages = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
  const [levelImages, setLevelImages] = useState(() => {
    const saved = localStorage.getItem('levelImages');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('levelImages', JSON.stringify(levelImages));
  }, [levelImages]);

  const setImageForLevel = (level, imageData) => {
    setLevelImages(prev => ({ ...prev, [level]: imageData }));
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
  };

  return (
    <ImageContext.Provider value={{ levelImages, setImageForLevel, removeImageForLevel, clearAllImages }}>
      {children}
    </ImageContext.Provider>
  );
};
