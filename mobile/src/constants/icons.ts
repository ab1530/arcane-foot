/**
 * Centralized Icon System for Arcane Football
 * Using Ionicons from @expo/vector-icons
 * Provides consistent, type-safe icon names across the app
 */

export type IconName = keyof typeof ICONS;

/**
 * Icon mapping for the entire application
 * Maps semantic names to Ionicons names
 */
export const ICONS = {
  // Navigation & Core
  home: 'home',
  homeOutline: 'home-outline',
  people: 'people',
  peopleOutline: 'people-outline',
  calendar: 'calendar',
  calendarOutline: 'calendar-outline',
  stats: 'stats-chart',
  statsOutline: 'stats-chart-outline',
  settings: 'settings',
  settingsOutline: 'settings-outline',

  // Actions
  add: 'add-circle',
  addOutline: 'add-circle-outline',
  remove: 'remove-circle',
  edit: 'create',
  editOutline: 'create-outline',
  delete: 'trash',
  deleteOutline: 'trash-outline',
  save: 'save',
  saveOutline: 'save-outline',
  download: 'download',
  downloadOutline: 'download-outline',
  upload: 'cloud-upload',
  uploadOutline: 'cloud-upload-outline',
  share: 'share-social',
  shareOutline: 'share-social-outline',
  copy: 'copy',
  copyOutline: 'copy-outline',

  // Navigation arrows
  arrowBack: 'arrow-back',
  arrowForward: 'arrow-forward',
  arrowUp: 'arrow-up',
  arrowDown: 'arrow-down',
  chevronBack: 'chevron-back',
  chevronForward: 'chevron-forward',
  chevronUp: 'chevron-up',
  chevronDown: 'chevron-down',

  // Search & Filter
  search: 'search',
  searchOutline: 'search-outline',
  filter: 'filter',
  filterOutline: 'filter-outline',
  funnel: 'funnel',
  funnelOutline: 'funnel-outline',

  // Notifications & Alerts
  notifications: 'notifications',
  notificationsOutline: 'notifications-outline',
  alert: 'alert-circle',
  alertOutline: 'alert-circle-outline',
  warning: 'warning',
  warningOutline: 'warning-outline',
  info: 'information-circle',
  infoOutline: 'information-circle-outline',

  // Status & Feedback
  checkmark: 'checkmark-circle',
  checkmarkOutline: 'checkmark-circle-outline',
  close: 'close-circle',
  closeOutline: 'close-circle-outline',
  help: 'help-circle',
  helpOutline: 'help-circle-outline',

  // Features
  ai: 'hardware-chip',
  aiOutline: 'hardware-chip-outline',
  chat: 'chatbubble',
  chatOutline: 'chatbubble-outline',
  document: 'document-text',
  documentOutline: 'document-text-outline',
  clipboard: 'clipboard',
  clipboardOutline: 'clipboard-outline',
  trophy: 'trophy',
  trophyOutline: 'trophy-outline',
  star: 'star',
  starOutline: 'star-outline',
  flash: 'flash',
  flashOutline: 'flash-outline',

  // User & Profile
  person: 'person',
  personOutline: 'person-outline',
  personCircle: 'person-circle',
  personCircleOutline: 'person-circle-outline',
  mail: 'mail',
  mailOutline: 'mail-outline',
  call: 'call',
  callOutline: 'call-outline',
  location: 'location',
  locationOutline: 'location-outline',

  // Sports specific
  football: 'football',
  footballOutline: 'football-outline',
  medal: 'medal',
  medalOutline: 'medal-outline',
  barbell: 'barbell',
  barbellOutline: 'barbell-outline',
  stopwatch: 'stopwatch',
  stopwatchOutline: 'stopwatch-outline',
  hand: 'hand-left',
  handOutline: 'hand-left-outline',
  fitness: 'fitness',
  fitnessOutline: 'fitness-outline',
  foot: 'footsteps',
  footOutline: 'footsteps-outline',
  scale: 'scale',
  scaleOutline: 'scale-outline',
  resize: 'resize',
  resizeOutline: 'resize-outline',

  // Media
  camera: 'camera',
  cameraOutline: 'camera-outline',
  image: 'image',
  imageOutline: 'image-outline',
  videocam: 'videocam',
  videocamOutline: 'videocam-outline',
  play: 'play-circle',
  playOutline: 'play-circle-outline',
  mic: 'mic',
  micOutline: 'mic-outline',

  // Business
  card: 'card',
  cardOutline: 'card-outline',
  wallet: 'wallet',
  walletOutline: 'wallet-outline',
  cash: 'cash',
  cashOutline: 'cash-outline',
  pricetag: 'pricetag',
  pricetagOutline: 'pricetag-outline',

  // Interface
  menu: 'menu',
  menuOutline: 'menu-outline',
  grid: 'grid',
  gridOutline: 'grid-outline',
  list: 'list',
  listOutline: 'list-outline',
  apps: 'apps',
  appsOutline: 'apps-outline',
  layers: 'layers',
  layersOutline: 'layers-outline',
  text: 'text',
  textOutline: 'text-outline',
  sparkles: 'sparkles',
  sparklesOutline: 'sparkles-outline',

  // Security & Privacy
  lock: 'lock-closed',
  lockOutline: 'lock-closed-outline',
  unlock: 'lock-open',
  unlockOutline: 'lock-open-outline',
  shield: 'shield-checkmark',
  shieldOutline: 'shield-checkmark-outline',
  eye: 'eye',
  eyeOutline: 'eye-outline',
  eyeOff: 'eye-off',
  eyeOffOutline: 'eye-off-outline',

  // Time & Date
  time: 'time',
  timeOutline: 'time-outline',
  timer: 'timer',
  timerOutline: 'timer-outline',
  today: 'today',
  todayOutline: 'today-outline',

  // Misc
  qrCode: 'qr-code',
  qrCodeOutline: 'qr-code-outline',
  barcode: 'barcode',
  barcodeOutline: 'barcode-outline',
  refresh: 'refresh',
  refreshOutline: 'refresh-outline',
  sync: 'sync',
  syncOutline: 'sync-outline',
  trending: 'trending-up',
  trendingOutline: 'trending-up-outline',
  trendingUp: 'trending-up',
  trendingDown: 'trending-down',
  analytics: 'analytics',
  analyticsOutline: 'analytics-outline',
  barChart: 'bar-chart',
  barChartOutline: 'bar-chart-outline',
  target: 'locate',
  targetOutline: 'locate-outline',

  // Logout & Exit
  logout: 'log-out',
  logoutOutline: 'log-out-outline',
  exit: 'exit',
  exitOutline: 'exit-outline',

  // Membership & Premium
  crown: 'shield-checkmark',
  crownOutline: 'shield-checkmark-outline',
  diamond: 'diamond',
  diamondOutline: 'diamond-outline',

  // Social
  heart: 'heart',
  heartOutline: 'heart-outline',
  thumbsUp: 'thumbs-up',
  thumbsUpOutline: 'thumbs-up-outline',

  // System
  cloud: 'cloud',
  cloudOutline: 'cloud-outline',
  cloudDone: 'cloud-done',
  cloudDoneOutline: 'cloud-done-outline',
  newspaper: 'newspaper',
  newspaperOutline: 'newspaper-outline',
  link: 'link',
  linkOutline: 'link-outline',

  // More
  ellipsisHorizontal: 'ellipsis-horizontal',
  ellipsisVertical: 'ellipsis-vertical',
  options: 'options',
  optionsOutline: 'options-outline',
} as const;

/**
 * Helper function to get icon name with type safety
 */
export const getIcon = (name: IconName): string => {
  return ICONS[name];
};

/**
 * Icon sizes following iOS Human Interface Guidelines
 */
export const ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/**
 * Get icon size value
 */
export const getIconSize = (size: IconSize): number => {
  return ICON_SIZES[size];
};
