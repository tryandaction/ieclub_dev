/**
 * 瀑布流布局组件 - 小红书风格
 * 实现多列自适应的瀑布流布局
 * 
 * 响应式规则：
 * - 移动端 (<640px): 2列
 * - 平板端 (640-1023px): 3列  
 * - 桌面端 (1024-1279px): 4列
 * - 大屏幕 (≥1280px): 4-5列
 */
import React, { useState, useEffect, useRef } from 'react';
import './MasonryGrid.scss';

const MasonryGrid = ({ children, gap = 16 }) => {
  const containerRef = useRef(null);
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = window.innerWidth;
      let newColumns;
      
      // 响应式断点
      if (width < 640) {
        // 移动端：双列
        newColumns = 2;
      } else if (width < 1024) {
        // 平板端：3列
        newColumns = 3;
      } else if (width < 1280) {
        // 桌面端：4列
        newColumns = 4;
      } else if (width < 1536) {
        // 大屏幕：4列
        newColumns = 4;
      } else {
        // 超大屏：5列
        newColumns = 5;
      }
      
      setColumns(newColumns);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

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

