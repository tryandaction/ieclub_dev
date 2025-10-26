/**
 * 瀑布流布局组件 - 小红书风格
 * 实现多列自适应的瀑布流布局
 */
import React, { useState, useEffect, useRef } from 'react';
import './MasonryGrid.scss';

const MasonryGrid = ({ children, gap = 16, minColumnWidth = 280 }) => {
  const containerRef = useRef(null);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const newColumns = Math.max(1, Math.floor(containerWidth / (minColumnWidth + gap)));
      setColumns(newColumns);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [gap, minColumnWidth]);

  // 将子元素分配到各列
  const distributeItems = () => {
    const cols = Array.from({ length: columns }, () => []);
    
    React.Children.forEach(children, (child, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(child);
    });
    
    return cols;
  };

  const columnItems = distributeItems();

  return (
    <div 
      ref={containerRef} 
      className="masonry-grid"
      style={{ gap: `${gap}px` }}
    >
      {columnItems.map((items, columnIndex) => (
        <div 
          key={columnIndex} 
          className="masonry-column"
          style={{ gap: `${gap}px` }}
        >
          {items.map((item, itemIndex) => (
            <div key={itemIndex} className="masonry-item">
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;

