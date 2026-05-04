import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  GameState,
  PlantType,
  Achievement,
  GameEvent,
} from '@/types/game';
import {
  PLANT_TYPES,
} from '@/types/game';
import {
  loadGame,
  saveGame,
  createDefaultState,
  plantSeed,
  waterPlant,
  harvestPlant,
  processAutoWater,
  processNaturalDecay,
  buyUpgrade,
  checkAchievements,
  getDailyReward,
  generateDailyQuests,
  updateQuests,
  claimQuestReward,
  generateRandomEvent,
  shouldLevelUnlockNotification,
  getUpgradeCost,
  getUpgradeEffect,
} from '@/lib/gameEngine';

export function useGame() {
  const [state, setState] = useState<GameState>(loadGame);
  const [lastSave, setLastSave] = useState(Date.now());
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);
  const [levelUps, setLevelUps] = useState<PlantType[]>([]);
  const [eventNotif, setEventNotif] = useState<GameEvent | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<
    { id: string; text: string; x: number; y: number; color: string }[]
  >([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Save periodically
  useEffect(() => {
    const id = setInterval(() => {
      saveGame(stateRef.current);
      setLastSave(Date.now());
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Save on unload
  useEffect(() => {
    const handler = () => saveGame(stateRef.current);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Auto-water loop
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const s = processAutoWater(prev);
        return { ...s };
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Natural decay loop (every second)
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const s = processNaturalDecay(prev, 1);
        return { ...s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Random events
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.currentEvent) {
          const elapsed = Date.now() - prev.currentEvent.startTime;
          if (elapsed >= prev.currentEvent.duration) {
            return { ...prev, currentEvent: null };
          }
          return prev;
        }
        const evt = generateRandomEvent();
        if (evt) {
          setEventNotif(evt);
          setTimeout(() => setEventNotif(null), 5000);
          return { ...prev, currentEvent: evt };
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Event timer cleanup
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.currentEvent) {
          const elapsed = Date.now() - prev.currentEvent.startTime;
          if (elapsed >= prev.currentEvent.duration) {
            return { ...prev, currentEvent: null };
          }
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Daily quests init
  useEffect(() => {
    setState((prev) => {
      if (prev.quests.length === 0) {
        return { ...prev, quests: generateDailyQuests() };
      }
      return prev;
    });
  }, []);

  // Playtime tracking
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          playTime: prev.stats.playTime + 1,
        },
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color = '#ffd600') => {
    const id = `${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev.slice(-20), { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 1500);
  }, []);

  const plant = useCallback(
    (typeId: string) => {
      setState((prev) => {
        const s = plantSeed(prev, typeId);
        return s || prev;
      });
    },
    []
  );

  const water = useCallback(
    (plantId: string) => {
      setState((prev) => {
        const s = waterPlant(prev, plantId);
        if (!s) return prev;
        return updateQuests(s, 'water', 1);
      });
    },
    []
  );

  const harvest = useCallback(
    (plantId: string) => {
      setState((prev) => {
        const result = harvestPlant(prev, plantId);
        if (!result) return prev;

        let s = result.state;
        s = updateQuests(s, 'harvest', 1);

        // Check achievements
        const ach = checkAchievements(s);
        s = ach.state;
        if (ach.newUnlocks.length > 0) {
          setNewUnlocks((prev) => [...prev, ...ach.newUnlocks]);
          setTimeout(() => setNewUnlocks((prev) => prev.slice(ach.newUnlocks.length)), 3000);
        }

        // Check level unlocks
        const prevLevel = prev.level;
        if (s.level > prevLevel) {
          const unlocks = shouldLevelUnlockNotification(s, prevLevel);
          if (unlocks.length > 0) {
            setLevelUps(unlocks);
            setTimeout(() => setLevelUps([]), 4000);
          }
        }

        return s;
      });

      return true;
    },
    []
  );

  const buy = useCallback(
    (upgradeId: string) => {
      setState((prev) => {
        const s = buyUpgrade(prev, upgradeId);
        if (!s) return prev;
        const updated = updateQuests(s, 'spend', getUpgradeCost(upgradeId, (prev.upgrades[upgradeId] || 0)));
        const ach = checkAchievements(updated);
        return ach.state;
      });
    },
    []
  );

  const claimDaily = useCallback(() => {
    setState((prev) => {
      const result = getDailyReward(prev);
      if (!result) return prev;
      return result.state;
    });
  }, []);

  const claimQuest = useCallback((questId: string) => {
    setState((prev) => {
      const s = claimQuestReward(prev, questId);
      return s || prev;
    });
  }, []);

  const selectPlantType = useCallback((typeId: string) => {
    setState((prev) => ({ ...prev, selectedPlantType: typeId }));
  }, []);

  const reset = useCallback(() => {
    if (confirm('Сбросить весь прогресс? Это необратимо!')) {
      const fresh = createDefaultState();
      setState(fresh);
      saveGame(fresh);
    }
  }, []);

  const eventTimeLeft = state.currentEvent
    ? Math.max(0, state.currentEvent.duration - (Date.now() - state.currentEvent.startTime))
    : 0;

  return {
    state,
    lastSave,
    newUnlocks,
    levelUps,
    eventNotif,
    eventTimeLeft,
    floatingTexts,
    addFloatingText,
    plant,
    water,
    harvest,
    buy,
    claimDaily,
    claimQuest,
    selectPlantType,
    reset,
    getUpgradeCost,
    getUpgradeEffect,
    PLANT_TYPES,
  };
}
