import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'search'
  | 'plus'
  | 'back'
  | 'chevron'
  | 'close'
  | 'play'
  | 'pause'
  | 'volume'
  | 'ellipsis'
  | 'folder'
  | 'check'
  | 'pencil'
  | 'shuffle'
  | 'gauge'
  | 'trash'
  | 'tag'
  | 'flip'
  | 'layers'
  | 'sparkle'
  | 'arrow-right'
  | 'headphones'
  | 'skip-back'
  | 'skip-fwd'
  | 'repeat';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export default function Icon({ name, size = 22, color = '#000', strokeWidth = 1.7, fill = false }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
  };
  const stroke = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="M20 20l-3.2-3.2" {...stroke} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path d="M12 5v14M5 12h14" {...stroke} />
        </Svg>
      );
    case 'back':
      return (
        <Svg {...common}>
          <Path d="M15 5l-7 7 7 7" {...stroke} />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...common}>
          <Path d="M9 5l7 7-7 7" {...stroke} />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common}>
          <Path d="M6 6l12 12M18 6L6 18" {...stroke} />
        </Svg>
      );
    case 'play':
      return (
        <Svg {...common}>
          <Path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z" fill={color} />
        </Svg>
      );
    case 'pause':
      return (
        <Svg {...common}>
          <Rect x={6.5} y={5} width={3.6} height={14} rx={1.2} fill={color} />
          <Rect x={13.9} y={5} width={3.6} height={14} rx={1.2} fill={color} />
        </Svg>
      );
    case 'volume':
      return (
        <Svg {...common}>
          <Path d="M4 9v6h3.5L13 19V5L7.5 9H4z" fill={fill ? color : 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M16.5 9.2a4 4 0 0 1 0 5.6" {...stroke} />
          <Path d="M19 6.7a7.5 7.5 0 0 1 0 10.6" {...stroke} />
        </Svg>
      );
    case 'ellipsis':
      return (
        <Svg {...common}>
          <Circle cx={5} cy={12} r={1.7} fill={color} />
          <Circle cx={12} cy={12} r={1.7} fill={color} />
          <Circle cx={19} cy={12} r={1.7} fill={color} />
        </Svg>
      );
    case 'folder':
      return (
        <Svg {...common}>
          <Path
            d="M3 7.5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.5.7l1 1.2a2 2 0 0 0 1.5.7H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5z"
            {...stroke}
          />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
        </Svg>
      );
    case 'pencil':
      return (
        <Svg {...common}>
          <Path
            d="M14.5 5.5l4 4M4 20l1-4.2L16.2 4.6a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z"
            {...stroke}
          />
        </Svg>
      );
    case 'shuffle':
      return (
        <Svg {...common}>
          <Path d="M4 6h3.5l9 12H20" {...stroke} />
          <Path d="M4 18h3.5l3-4" {...stroke} />
          <Path d="M14 8l2.5-2 .8 0M20 6l-2 0-2 2" {...stroke} />
          <Path d="M17 16l3 2-3 2" {...stroke} />
          <Path d="M17 4l3 2-3 2" {...stroke} />
        </Svg>
      );
    case 'gauge':
      return (
        <Svg {...common}>
          <Path d="M5 18a8 8 0 1 1 14 0" {...stroke} />
          <Path d="M12 14l4-4" {...stroke} />
          <Circle cx={12} cy={14.5} r={1.3} fill={color} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path
            d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M7 7l.8 11.2A1.8 1.8 0 0 0 9.6 20h4.8a1.8 1.8 0 0 0 1.8-1.8L17 7"
            {...stroke}
          />
        </Svg>
      );
    case 'tag':
      return (
        <Svg {...common}>
          <Path
            d="M4 12.5V5a1 1 0 0 1 1-1h7.5a2 2 0 0 1 1.4.6l5.5 5.5a2 2 0 0 1 0 2.8l-6.5 6.5a2 2 0 0 1-2.8 0L4.6 13.9A2 2 0 0 1 4 12.5z"
            {...stroke}
          />
          <Circle cx={8.5} cy={8.5} r={1.3} fill={color} />
        </Svg>
      );
    case 'flip':
      return (
        <Svg {...common}>
          <Path d="M7 8l-3 3 3 3" {...stroke} />
          <Path d="M4 11h11a5 5 0 0 1 0 10h-1" {...stroke} />
        </Svg>
      );
    case 'layers':
      return (
        <Svg {...common}>
          <Path d="M12 4l8 4-8 4-8-4 8-4z" {...stroke} />
          <Path d="M4 12l8 4 8-4" {...stroke} />
          <Path d="M4 16l8 4 8-4" {...stroke} />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg {...common}>
          <Path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" {...stroke} />
        </Svg>
      );
    case 'arrow-right':
      return (
        <Svg {...common}>
          <Path d="M5 12h13M13 6l6 6-6 6" {...stroke} />
        </Svg>
      );
    case 'headphones':
      return (
        <Svg {...common}>
          <Path d="M4 14v-2a8 8 0 0 1 16 0v2" {...stroke} />
          <Rect x={3} y={13.5} width={4.4} height={7} rx={2.2} {...stroke} />
          <Rect x={16.6} y={13.5} width={4.4} height={7} rx={2.2} {...stroke} />
        </Svg>
      );
    case 'skip-back':
      return (
        <Svg {...common}>
          <Path d="M9 12L18 6.2A1 1 0 0 1 19.5 7v10a1 1 0 0 1-1.5.8L9 12z" fill={color} />
          <Rect x={5} y={5.5} width={2.6} height={13} rx={1.1} fill={color} />
        </Svg>
      );
    case 'skip-fwd':
      return (
        <Svg {...common}>
          <Path d="M15 12L6 6.2A1 1 0 0 0 4.5 7v10a1 1 0 0 0 1.5.8L15 12z" fill={color} />
          <Rect x={16.4} y={5.5} width={2.6} height={13} rx={1.1} fill={color} />
        </Svg>
      );
    case 'repeat':
      return (
        <Svg {...common}>
          <Path d="M17 3l3 3-3 3" {...stroke} />
          <Path d="M20 6H8a4 4 0 0 0-4 4v1" {...stroke} />
          <Path d="M7 21l-3-3 3-3" {...stroke} />
          <Path d="M4 18h12a4 4 0 0 0 4-4v-1" {...stroke} />
        </Svg>
      );
    default:
      return null;
  }
}
