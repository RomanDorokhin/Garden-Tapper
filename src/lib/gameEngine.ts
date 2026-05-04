import type {
  GameState,
  PlantedPlant,
  PlantType,
  Achievement,
  Quest,
  GameEvent,
} from '@/types/game';
import {
  PLANT_TYPES,
  UPGRADES,
  INITIAL_ACHIEVEMENTS,
  DAILY_QUESTS,
} from '@/types/game';

const SAVE_KEY = 'garden_tapper_save_v2';

export function createDefaultState(): GameState {
  const now = Date.now();
  return {
    coins: 100,
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalHarvests: 0,
    totalTaps: 0,
    totalCoinsEarned: 0,
    highestCombo: 0,
    currentCombo: 0,
    plantsUnlocked: ['sunflower'],
    plants: [],
    upgrades: {},
    achievements: INITIAL_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, progress: 0 })),
    quests: [],
    currentEvent: null,
    lastDailyReward: 0,
    streakDays: 0,
    soundEnabled: true,
    vibrationEnabled: true,
    selectedPlantType: 'sunflower',
    stats: {
      playTime: 0,
      lastPlayed: now,
      sessions: 1,
    },
    version: 2,
  };
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.version || parsed.version < 2) {
      return migrateState(parsed);
    }
    return { ...createDefaultState(), ...parsed };
  } catch {
    return createDefaultState();
  }
}

function migrateState(old: Partial<GameState>): GameState {
  const fresh = createDefaultState();
  fresh.coins = old.coins ?? fresh.coins;
  fresh.level = old.level ?? fresh.level;
  fresh.xp = old.xp ?? fresh.xp;
  fresh.plantsUnlocked = old.plantsUnlocked ?? fresh.plantsUnlocked;
  fresh.upgrades = old.upgrades ?? fresh.upgrades;
  fresh.totalHarvests = old.totalHarvests ?? fresh.totalHarvests;
  return fresh;
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getUpgradeCost(upgradeId: string, level: number): number {
  const up = UPGRADES.find((u) => u.id === upgradeId);
  if (!up) return Infinity;
  return Math.floor(up.baseCost * Math.pow(up.costMultiplier, level));
}

export function getUpgradeEffect(upgradeId: string, level: number): number {
  switch (upgradeId) {
    case 'gardener':
      return level * 1.5; // авто-полив
    case 'barrel':
      return 5 + level * 3; // влага за тап
    case 'fertilizer':
      return 1 + level * 0.2; // множитель скорости
    case 'sprinkler':
      return level >= 1 ? 2 + (level - 1) : 1; // количество растений за полив
    case 'greenhouse':
      return level * 0.15; // защита от событий
    case 'multitap':
      return 1 + level * 0.15; // множитель урожая
    case 'composter':
      return level * 0.05; // шанс двойного урожая
    default:
      return 0;
  }
}

export function canPlant(state: GameState, typeId: string): boolean {
  const type = PLANT_TYPES.find((p) => p.id === typeId);
  if (!type) return false;
  if (!state.plantsUnlocked.includes(typeId)) return false;
  const maxPlants = 3 + Math.floor((state.upgrades['sprinkler'] || 0) / 2);
  if (state.plants.length >= maxPlants) return false;
  return true;
}

export function plantSeed(state: GameState, typeId: string): GameState | null {
  if (!canPlant(state, typeId)) return null;
  const type = PLANT_TYPES.find((p) => p.id === typeId);
  if (!type) return null;

  const newPlant: PlantedPlant = {
    id: `plant_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    typeId,
    moisture: 0,
    growth: 0,
    isMature: false,
    plantedAt: Date.now(),
    lastWatered: Date.now(),
    comboCount: 0,
    lastTap: 0,
  };

  return {
    ...state,
    plants: [...state.plants, newPlant],
  };
}

export function waterPlant(state: GameState, plantId: string): GameState | null {
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant || plant.isMature) return null;

  const barrelLevel = state.upgrades['barrel'] || 0;
  const baseWater = getUpgradeEffect('barrel', barrelLevel);

  let add = baseWater;

  // События
  if (state.currentEvent?.effect === 'rain') {
    add *= 1.5;
  } else if (state.currentEvent?.effect === 'drought') {
    add *= 0.5;
  }

  // Шанс суперполива
  if (Math.random() < 0.1) {
    add *= 2;
  }

  // Комбо
  const now = Date.now();
  let combo = plant.comboCount;
  if (now - plant.lastTap < 2000) {
    combo++;
  } else {
    combo = 1;
  }
  const comboBonus = Math.min(combo * 0.05, 0.5); // до 50% бонуса
  add *= (1 + comboBonus);

  const newMoisture = Math.min(100, plant.moisture + add);
  const moistureDiff = newMoisture - plant.moisture;

  // Рост от влаги
  const type = PLANT_TYPES.find((p) => p.id === plant.typeId);
  const fertLevel = state.upgrades['fertilizer'] || 0;
  const growthSpeed = getUpgradeEffect('fertilizer', fertLevel);
  const growthFromWater = (moistureDiff / 100) * (100 / (type?.growTime || 60)) * growthSpeed * 10;

  const newGrowth = Math.min(100, plant.growth + growthFromWater);
  const isMature = newGrowth >= 100;

  const newPlants = state.plants.map((p) =>
    p.id === plantId
      ? {
          ...p,
          moisture: newMoisture,
          growth: isMature ? 100 : newGrowth,
          isMature,
          comboCount: combo,
          lastTap: now,
        }
      : p
  );

  const newCombo = Math.max(state.currentCombo, combo);
  const newHighestCombo = Math.max(state.highestCombo, combo);

  return {
    ...state,
    plants: newPlants,
    totalTaps: state.totalTaps + 1,
    currentCombo: isMature ? 0 : newCombo,
    highestCombo: newHighestCombo,
  };
}

export function harvestPlant(state: GameState, plantId: string): { state: GameState; yield: number; isDouble: boolean } | null {
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant || !plant.isMature) return null;

  const type = PLANT_TYPES.find((p) => p.id === plant.typeId);
  if (!type) return null;

  const multiLevel = state.upgrades['multitap'] || 0;
  const yieldMult = getUpgradeEffect('multitap', multiLevel);

  const eventMult = state.currentEvent?.effect === 'rainbow' ? 2 : 1;

  let earned = Math.floor(type.baseYield * yieldMult * eventMult);

  // Компостер - шанс двойного урожая
  const compLevel = state.upgrades['composter'] || 0;
  const doubleChance = getUpgradeEffect('composter', compLevel);
  const isDouble = Math.random() < doubleChance;
  if (isDouble) earned *= 2;

  const xpGain = Math.floor(earned * 0.5);
  let newXp = state.xp + xpGain;
  let newLevel = state.level;
  let newXpToNext = state.xpToNext;

  while (newXp >= newXpToNext) {
    newXp -= newXpToNext;
    newLevel++;
    newXpToNext = Math.floor(newXpToNext * 1.2);
  }

  // Разблокировка растений
  const newlyUnlocked = PLANT_TYPES.filter(
    (p) => p.unlockLevel <= newLevel && !state.plantsUnlocked.includes(p.id)
  ).map((p) => p.id);

  const newPlantsUnlocked = [...state.plantsUnlocked, ...newlyUnlocked];

  const newPlants = state.plants.filter((p) => p.id !== plantId);

  return {
    state: {
      ...state,
      coins: state.coins + earned,
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      totalHarvests: state.totalHarvests + 1,
      totalCoinsEarned: state.totalCoinsEarned + earned,
      plants: newPlants,
      plantsUnlocked: newPlantsUnlocked,
      currentCombo: 0,
    },
    yield: earned,
    isDouble,
  };
}

export function processAutoWater(state: GameState): GameState {
  const gardenerLevel = state.upgrades['gardener'] || 0;
  if (gardenerLevel <= 0) return state;

  const waterAmount = getUpgradeEffect('gardener', gardenerLevel);
  const sprinklerLevel = state.upgrades['sprinkler'] || 0;
  const maxAffected = sprinklerLevel > 0 ? 2 + (sprinklerLevel - 1) : 1;

  let newPlants = [...state.plants];
  let affected = 0;

  for (let i = 0; i < newPlants.length && affected < maxAffected; i++) {
    const p = newPlants[i];
    if (p.isMature) continue;

    const newMoisture = Math.min(100, p.moisture + waterAmount);
    if (newMoisture > p.moisture) {
      const type = PLANT_TYPES.find((pt) => pt.id === p.typeId);
      const fertLevel = state.upgrades['fertilizer'] || 0;
      const growthSpeed = getUpgradeEffect('fertilizer', fertLevel);
      const moistureDiff = newMoisture - p.moisture;
      const growthFromWater = (moistureDiff / 100) * (100 / (type?.growTime || 60)) * growthSpeed * 10;
      const newGrowth = Math.min(100, p.growth + growthFromWater);

      newPlants[i] = {
        ...p,
        moisture: newMoisture,
        growth: newGrowth,
        isMature: newGrowth >= 100,
      };
      affected++;
    }
  }

  return { ...state, plants: newPlants };
}

export function processNaturalDecay(state: GameState, dt: number): GameState {
  const newPlants = state.plants.map((p) => {
    if (p.isMature) return p;
    const type = PLANT_TYPES.find((pt) => pt.id === p.typeId);
    const decay = (type?.waterConsumption || 0.3) * dt * 0.5;

    // Защита от событий
    const greenhouseLevel = state.upgrades['greenhouse'] || 0;
    const protection = getUpgradeEffect('greenhouse', greenhouseLevel);

    let finalDecay = decay;
    if (state.currentEvent?.effect === 'drought') {
      finalDecay *= (2 - protection);
    } else if (state.currentEvent?.effect === 'rain') {
      finalDecay *= 0.5;
    }

    return {
      ...p,
      moisture: Math.max(0, p.moisture - finalDecay),
    };
  });

  return { ...state, plants: newPlants };
}

export function buyUpgrade(state: GameState, upgradeId: string): GameState | null {
  const up = UPGRADES.find((u) => u.id === upgradeId);
  if (!up) return null;

  const currentLevel = state.upgrades[upgradeId] || 0;
  if (currentLevel >= up.maxLevel) return null;

  const cost = getUpgradeCost(upgradeId, currentLevel);
  if (state.coins < cost) return null;

  return {
    ...state,
    coins: state.coins - cost,
    upgrades: {
      ...state.upgrades,
      [upgradeId]: currentLevel + 1,
    },
  };
}

export function checkAchievements(state: GameState): { state: GameState; newUnlocks: Achievement[] } {
  const newUnlocks: Achievement[] = [];
  const newAchievements = state.achievements.map((a) => {
    if (a.unlocked) return a;

    let progress = 0;
    switch (a.type) {
      case 'harvests':
        progress = state.totalHarvests;
        break;
      case 'coins':
        progress = state.totalCoinsEarned;
        break;
      case 'taps':
        progress = state.totalTaps;
        break;
      case 'level':
        progress = state.level;
        break;
      case 'plants':
        progress = state.plantsUnlocked.length;
        break;
      case 'combo':
        progress = state.highestCombo;
        break;
      case 'upgrades':
        progress = Object.values(state.upgrades).reduce((s, v) => s + v, 0);
        break;
    }

    const unlocked = progress >= a.requirement;
    if (unlocked && !a.unlocked) {
      newUnlocks.push({ ...a, progress, unlocked });
    }
    return { ...a, progress, unlocked };
  });

  const rewardCoins = newUnlocks.reduce((sum, a) => sum + a.reward, 0);

  return {
    state: {
      ...state,
      achievements: newAchievements,
      coins: state.coins + rewardCoins,
    },
    newUnlocks,
  };
}

export function generateDailyQuests(): Quest[] {
  // Always regenerate quests for a new day
  return DAILY_QUESTS.map((q) => ({
    ...q,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

export function updateQuests(state: GameState, type: Quest['type'], amount: number): GameState {
  const newQuests = state.quests.map((q) => {
    if (q.completed || q.type !== type) return q;
    const newCurrent = q.current + amount;
    return {
      ...q,
      current: newCurrent,
      completed: newCurrent >= q.target,
    };
  });

  return { ...state, quests: newQuests };
}

export function claimQuestReward(state: GameState, questId: string): GameState | null {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || !quest.completed || quest.claimed) return null;

  const newQuests = state.quests.map((q) =>
    q.id === questId ? { ...q, claimed: true } : q
  );

  return {
    ...state,
    coins: state.coins + quest.reward,
    quests: newQuests,
  };
}

export function getDailyReward(state: GameState): { state: GameState; reward: number; isStreak: boolean } | null {
  const now = Date.now();
  const lastDay = new Date(state.lastDailyReward);
  const today = new Date(now);

  const isSameDay =
    lastDay.getDate() === today.getDate() &&
    lastDay.getMonth() === today.getMonth() &&
    lastDay.getFullYear() === today.getFullYear();

  if (isSameDay) return null;

  const yesterday = new Date(now - 86400000);
  const isStreak =
    lastDay.getDate() === yesterday.getDate() &&
    lastDay.getMonth() === yesterday.getMonth() &&
    lastDay.getFullYear() === yesterday.getFullYear();

  const streak = isStreak ? state.streakDays + 1 : 1;
  const baseReward = 50;
  const streakBonus = Math.min(streak * 20, 200);
  const reward = baseReward + streakBonus;

  return {
    state: {
      ...state,
      coins: state.coins + reward,
      lastDailyReward: now,
      streakDays: streak,
    },
    reward,
    isStreak,
  };
}

export function generateRandomEvent(): GameEvent | null {
  const events: GameEvent[] = [
    {
      id: 'rain',
      name: 'Дождь',
      emoji: '🌧️',
      description: 'Все растения получают больше влаги!',
      duration: 30000,
      startTime: Date.now(),
      active: true,
      effect: 'rain',
    },
    {
      id: 'drought',
      name: 'Засуха',
      emoji: '☀️',
      description: 'Влага испаряется быстрее.',
      duration: 30000,
      startTime: Date.now(),
      active: true,
      effect: 'drought',
    },
    {
      id: 'rainbow',
      name: 'Радуга',
      emoji: '🌈',
      description: 'Двойной доход от урожая!',
      duration: 20000,
      startTime: Date.now(),
      active: true,
      effect: 'rainbow',
    },
    {
      id: 'meteor',
      name: 'Метеоритный дождь',
      emoji: '☄️',
      description: 'Редкие минералы удобряют почву!',
      duration: 15000,
      startTime: Date.now(),
      active: true,
      effect: 'meteor',
    },
  ];

  if (Math.random() < 0.3) {
    return events[Math.floor(Math.random() * events.length)];
  }
  return null;
}

export function shouldLevelUnlockNotification(state: GameState, prevLevel: number): PlantType[] {
  return PLANT_TYPES.filter(
    (p) => p.unlockLevel > prevLevel && p.unlockLevel <= state.level
  );
}
