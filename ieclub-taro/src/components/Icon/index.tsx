import { View } from '@tarojs/components'
import './index.scss'

interface IconProps {
  icon: string
  size?: number | string
  color?: string
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

/**
 * 通用图标组件
 * 使用 Iconify 图标库
 * 
 * @example
 * <Icon icon="mdi:heart" size={24} color="#ff0000" />
 * <Icon icon={IconConfig.interaction.like} size="20px" />
 */
const Icon: React.FC<IconProps> = ({ 
  icon, 
  size = 24, 
  color, 
  className = '',
  onClick,
  style = {}
}) => {
  const iconSize = typeof size === 'number' ? `${size}px` : size
  
  const iconStyle: React.CSSProperties = {
    fontSize: iconSize,
    width: iconSize,
    height: iconSize,
    lineHeight: iconSize,
    color: color,
    ...style
  }

  return (
    <View 
      className={`icon-component ${className}`}
      style={iconStyle}
      onClick={onClick}
    >
      <span 
        className="iconify" 
        data-icon={icon}
        style={{ display: 'inline-block', width: '100%', height: '100%' }}
      />
    </View>
  )
}

export default Icon

