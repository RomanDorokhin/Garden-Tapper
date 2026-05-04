export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
  baseYield: number;
  growTime: number; // в секундах до созревания при 100% влаги
  waterConsumption: number; // влага тратится со временем
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

export interface PlantedPlant {
  id: string;
  typeId: string;
  moisture: number; // 0-100
  growth: number; // 0-100
  isMature: boolean;
  plantedAt: number;
  lastWatered: number;
  comboCount: number;
  lastTap: number;
}

export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: string;
}

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: number;
  type: 'harvests' | 'coins' | 'taps' | 'level' | 'plants' | 'combo' | 'upgrades';
  reward: number;
  unlocked: boolean;
  progress: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
  type: 'harvest' | 'water' | 'tap' | 'spend';
}

export interface GameEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number; // ms
  startTime: number;
  active: boolean;
  effect: 'rain' | 'drought' | 'rainbow' | 'meteor' | 'frost' | 'wind';
}

export interface GameState {
  coins: number;
  level: number;
  xp: number;
  xpToNext: number;
  totalHarvests: number;
  totalTaps: number;
  totalCoinsEarned: number;
  highestCombo: number;
  currentCombo: number;
  plantsUnlocked: string[];
  plants: PlantedPlant[];
  upgrades: Record<string, number>;
  achievements: Achievement[];
  quests: Quest[];
  currentEvent: GameEvent | null;
  lastDailyReward: number;
  streakDays: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  selectedPlantType: string;
  stats: {
    playTime: number;
    lastPlayed: number;
    sessions: number;
  };
  version: number;
}

export const PLANT_TYPES: PlantType[] = [
  {
    id: 'sunflower',
    name: 'Подсолнух',
    emoji: '🌻',
    description: 'Классика садоводства. Быстро растет и приносит стабильный доход.',
    unlockLevel: 1,
    baseYield: 10,
    growTime: 60,
    waterConsumption: 0.3,
    rarity: 'common',
    color: '#ffd600',
  },
  {
    id: 'rose',
    name: 'Роза',
    emoji: '🌹',
    description: 'Прекрасная роза. Средний рост, но хорошая прибыль.',
    unlockLevel: 2,
    baseYield: 25,
    growTime: 90,
    waterConsumption: 0.4,
    rarity: 'common',
    color: '#e91e63',
  },
  {
    id: 'tulip',
    name: 'Тюльпан',
    emoji: '🌷',
    description: 'Яркий тюльпан. Быстрое созревание!',
    unlockLevel: 3,
    baseYield: 40,
    growTime: 45,
    waterConsumption: 0.5,
    rarity: 'common',
    color: '#e040fb',
  },
  {
    id: 'cactus',
    name: 'Кактус',
    emoji: '🌵',
    description: 'Не требует много воды. Идеален для засушливых дней.',
    unlockLevel: 5,
    baseYield: 80,
    growTime: 120,
    waterConsumption: 0.15,
    rarity: 'rare',
    color: '#4caf50',
  },
  {
    id: 'cherry',
    name: 'Сакура',
    emoji: '🌸',
    description: 'Редкое дерево сакуры. Приносит много монет.',
    unlockLevel: 7,
    baseYield: 150,
    growTime: 180,
    waterConsumption: 0.6,
    rarity: 'rare',
    color: '#ffb7c5',
  },
  {
    id: 'palm',
    name: 'Пальма',
    emoji: '🌴',
    description: 'Тропическая пальма. Даёт кокосы и хороший урожай.',
    unlockLevel: 10,
    baseYield: 300,
    growTime: 240,
    waterConsumption: 0.7,
    rarity: 'epic',
    color: '#8bc34a',
  },
  {
    id: 'bonsai',
    name: 'Бонсай',
    emoji: '🪴',
    description: 'Древнее искусство. Медленно, но очень прибыльно.',
    unlockLevel: 15,
    baseYield: 800,
    growTime: 360,
    waterConsumption: 0.2,
    rarity: 'epic',
    color: '#795548',
  },
  {
    id: 'golden',
    name: 'Золотое Древо',
    emoji: '✨',
    description: 'Легендарное растение. Огромная прибыль!',
    unlockLevel: 25,
    baseYield: 5000,
    growTime: 600,
    waterConsumption: 1.0,
    rarity: 'legendary',
    color: '#ffd700',
  },
];

export const UPGRADES: Omit<Upgrade, 'level'>[] = [
  {
    id: 'gardener',
    name: 'Садовник',
    emoji: '👨‍🌾',
    description: 'Авто-полив всех растений',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 2.5,
    effect: 'autoWater',
  },
  {
    id: 'barrel',
    name: 'Бочка',
    emoji: '🪣',
    description: '+влага за каждый тап',
    maxLevel: 15,
    baseCost: 50,
    costMultiplier: 1.8,
    effect: 'waterPerTap',
  },
  {
    id: 'fertilizer',
    name: 'Удобрение',
    emoji: '💊',
    description: 'Ускоряет рост растений',
    maxLevel: 10,
    baseCost: 200,
    costMultiplier: 2.2,
    effect: 'growthSpeed',
  },
  {
    id: 'sprinkler',
    name: 'Спринклер',
    emoji: '⛲',
    description: 'Поливает сразу несколько растений',
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 3.0,
    effect: 'multiWater',
  },
  {
    id: 'greenhouse',
    name: 'Теплица',
    emoji: '🏠',
    description: 'Меньше потерь влаги от событий',
    maxLevel: 5,
    baseCost: 1000,
    costMultiplier: 2.5,
    effect: 'eventProtection',
  },
  {
    id: 'multitap',
    name: 'Мультитап',
    emoji: '👆',
    description: 'Больше монет за сбор урожая',
    maxLevel: 20,
    baseCost: 75,
    costMultiplier: 1.6,
    effect: 'yieldMultiplier',
  },
  {
    id: 'composter',
    name: 'Компостер',
    emoji: '🗑️',
    description: 'Шанс двойного урожая',
    maxLevel: 10,
    baseCost: 300,
    costMultiplier: 2.0,
    effect: 'doubleChance',
  },
];

export const INITIAL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  { id: 'first_harvest', name: 'Первый урожай', emoji: '🌱', description: 'Соберите первый урожай', requirement: 1, type: 'harvests', reward: 50 },
  { id: 'gardener_10', name: 'Опытный фермер', emoji: '🚜', description: 'Соберите 10 урожаев', requirement: 10, type: 'harvests', reward: 150 },
  { id: 'gardener_100', name: 'Фермерский магнат', emoji: '🌾', description: 'Соберите 100 урожаев', requirement: 100, type: 'harvests', reward: 1000 },
  { id: 'rich_100', name: 'Первая сотня', emoji: '💰', description: 'Заработайте 100 монет', requirement: 100, type: 'coins', reward: 50 },
  { id: 'rich_1000', name: 'Тысячник', emoji: '💵', description: 'Заработайте 1000 монет', requirement: 1000, type: 'coins', reward: 500 },
  { id: 'rich_10000', name: 'Богач', emoji: '💎', description: 'Заработайте 10000 монет', requirement: 10000, type: 'coins', reward: 5000 },
  { id: 'tap_100', name: 'Тапер', emoji: '👆', description: 'Сделайте 100 тапов', requirement: 100, type: 'taps', reward: 100 },
  { id: 'tap_1000', name: 'Мастер тапов', emoji: '👑', description: 'Сделайте 1000 тапов', requirement: 1000, type: 'taps', reward: 500 },
  { id: 'level_5', name: 'Росток', emoji: '📈', description: 'Достигните 5 уровня', requirement: 5, type: 'level', reward: 200 },
  { id: 'level_20', name: 'Дерево', emoji: '🌳', description: 'Достигните 20 уровня', requirement: 20, type: 'level', reward: 2000 },
  { id: 'combo_10', name: 'Комбо-старт', emoji: '⚡', description: 'Достигните комбо ×10', requirement: 10, type: 'combo', reward: 200 },
  { id: 'combo_50', name: 'Комбо-бог', emoji: '🔥', description: 'Достигните комбо ×50', requirement: 50, type: 'combo', reward: 2000 },
  { id: 'all_plants', name: 'Ботаник', emoji: '📚', description: 'Разблокируйте все растения', requirement: 8, type: 'plants', reward: 5000 },
  { id: 'upgrades_20', name: 'Инвестор', emoji: '🏗️', description: 'Купите 20 улучшений', requirement: 20, type: 'upgrades', reward: 1000 },
];

export const DAILY_QUESTS: Omit<Quest, 'current' | 'completed' | 'claimed'>[] = [
  { id: 'dq_harvest', name: 'Урожайный день', description: 'Соберите 5 урожаев', target: 5, reward: 100, type: 'harvest' },
  { id: 'dq_water', name: 'Поливальщик', description: 'Полейте растения 20 раз', target: 20, reward: 80, type: 'water' },
  { id: 'dq_tap', name: 'Активный день', description: 'Сделайте 50 тапов', target: 50, reward: 50, type: 'tap' },
  { id: 'dq_spend', name: 'Шопоголик', description: 'Потратьте 500 монет', target: 500, reward: 200, type: 'spend' },
];
