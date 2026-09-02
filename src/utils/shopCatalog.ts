import { 
  BACKGROUNDS_CATALOG, 
  LAYOUTS_CATALOG, 
  LAYOUT_BASE_TEMPLATES,
  getBackgroundById, 
  getLayoutById, 
  getLayoutConfig,
  getAllBackgrounds,
  getAllLayouts 
} from './shopCatalog.js';

export interface WallpaperItem {
  id: string;
  name: string;
  description: string;
  category: 'Espaço' | 'Anime' | 'Cyberpunk' | 'Minimalista' | 'Natureza' | 'VIP' | 'Custom' | string;
  price: number;
  url: string;
  isDefault?: boolean;
  vipOnly?: boolean;
}

export interface LayoutTextFieldConfig {
  x?: number;
  y?: number;
  font?: string;
  color?: string;
  align?: 'left' | 'right' | 'center';
  prefix?: string;
  suffix?: string;
  maxWidth?: number;
  maxLines?: number;
  lineHeight?: number;
  textShadow?: string | boolean;
}

export interface LayoutItem {
  id: string;
  name: string;
  description: string;
  category: 'Clássico' | 'Moderno' | 'Premium' | 'Cyberpunk' | 'Anime' | 'VIP' | string;
  price: number;
  themeColor: string;
  previewUrl: string;
  overlay?: string;
  templateType?: 'classic' | 'modern' | string;
  themeMode?: 'dark' | 'light' | string;
  textColor?: string;
  textShadow?: string | boolean;
  isDefault?: boolean;
  vipOnly?: boolean;
  badgeBackground?: boolean | string;
  avatar?: {
    x?: number;
    y?: number;
    radius?: number;
    border?: string;
    borderRadius?: string;
  };
  textos?: {
    username?: LayoutTextFieldConfig;
    sobremim?: LayoutTextFieldConfig;
    carteira?: LayoutTextFieldConfig;
    banco?: LayoutTextFieldConfig;
    rankBanco?: LayoutTextFieldConfig;
    reputacao?: LayoutTextFieldConfig;
    [key: string]: LayoutTextFieldConfig | undefined;
  };
  badges?: {
    startX?: number;
    startY?: number;
    spacing?: number;
    size?: number;
    badgeBackground?: boolean | string;
  };
  casamento?: {
    enabled?: boolean;
    exibirAnel?: boolean;
    exibirData?: boolean;
    ringX?: number;
    ringY?: number;
    nameX?: number;
    nameY?: number;
    dateX?: number;
    dateY?: number;
    font?: string;
    color?: string;
    align?: 'left' | 'right' | 'center';
  } | null;
  config?: any;
}

export interface LayoutRenderConfig {
  id: string;
  name: string;
  templateType: 'classic' | 'modern' | string;
  themeMode: 'dark' | 'light' | string;
  themeColor: string;
  textColor: string;
  textShadow: string;
  overlay: string;
  overlayBadge?: string | null;
  overlayMarried?: string | null;
  badgeBackground?: boolean | string;
  avatar: { x: number; y: number; radius: number; border?: string; borderRadius?: string; };
  textos: Record<string, {
    x: number;
    y: number;
    font: string;
    color: string;
    align: 'left' | 'right' | 'center';
    prefix?: string;
    suffix?: string;
    maxWidth?: number;
    maxLines?: number;
    lineHeight?: number;
    textShadow?: string | boolean;
  }>;
  badges: { startX: number; startY: number; spacing: number; size: number };
  casamento?: {
    exibirAnel?: boolean;
    exibirData?: boolean;
    ringX?: number;
    ringY?: number;
    nameX?: number;
    nameY?: number;
    dateX?: number;
    dateY?: number;
    font?: string;
    color?: string;
    align?: 'left' | 'right' | 'center';
  } | null;
}

export { 
  BACKGROUNDS_CATALOG, 
  LAYOUTS_CATALOG, 
  LAYOUT_BASE_TEMPLATES,
  getBackgroundById, 
  getLayoutById, 
  getLayoutConfig,
  getAllBackgrounds,
  getAllLayouts 
};
