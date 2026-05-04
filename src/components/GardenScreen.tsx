import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlantCanvas } from './PlantCanvas';
import type { GameState } from '@/types/game';
import { PLANT_TYPES } from '@/types/game';
import { useTelegram, useSound } from '@/hooks/useTelegram';

interface GardenScreenProps {
  state: GameState;
  onWater: (id: string) => void;
  onHarvest: (id: string) => void;
  onPlant: (typeId: string) => void;
  addFloatingText: (text: string, x: number, y: number, color?: string) => void;
}

export function GardenScreen({ state, onWater, onHarvest, onPlant, addFloatingText }: GardenScreenProps) {
  const { haptic, hapticSuccess } = useTelegram();
  const sound = useSound();
  const [pressedPlant, setPressedPlant] = useState<string | null>(null);

  const handleTap = useCallback(
    (plantId: string, isMature: boolean) => {
      if (isMature) {
        onHarvest(plantId);
        hapticSuccess();
        sound.harvest();
        addFloatingText('🌾 Урожай!', 0, 0);
      } else {
        onWater(plantId);
        haptic('light');
        sound.water();
        setPressedPlant(plantId);
        setTimeout(() => setPressedPlant(null), 150);
        if (Math.random() < 0.1) {
          sound.superWater();
          addFloatingText('💦 Супер!', 0, 0, '#42a5f5');
        }
      }
    },
    [haptic, hapticSuccess, sound, onWater, onHarvest, addFloatingText]
  );

  const selectedType = PLANT_TYPES.find((p) => p.id === state.selectedPlantType) || PLANT_TYPES[0];
  const canPlantMore = state.plants.length < 3 + Math.floor((state.upgrades['sprinkler'] || 0) / 2);

  return (
    <div className="flex flex-col items-center w-full h-full overflow-y-auto pb-24">
      {/* Event Banner */}
      <AnimatePresence>
        {state.currentEvent && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-black/70 border border-white/20 backdrop-blur-md"
          >
            <span className="text-sm font-bold text-white whitespace-nowrap">
              {state.currentEvent.emoji} {state.currentEvent.name} — {state.currentEvent.description}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plants Grid */}
      <div className="flex flex-col items-center gap-4 mt-4 w-full px-4">
        {state.plants.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-white/60"
          >
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-lg font-bold">Ваш сад пуст!</p>
            <p className="text-sm mt-1">Посадите первое растение</p>
          </motion.div>
        )}

        {state.plants.map((plant) => {
          const type = PLANT_TYPES.find((p) => p.id === plant.typeId) || PLANT_TYPES[0];
          return (
            <motion.div
              key={plant.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative flex flex-col items-center"
            >
              <PlantCanvas
                plant={plant}
                plantType={type}
                size={Math.min(280, window.innerWidth * 0.5)}
                onTap={() => handleTap(plant.id, false)}
                onHarvest={() => handleTap(plant.id, true)}
                isPressed={pressedPlant === plant.id}
              />
              <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                <span>{type.emoji}</span>
                <span>{type.name}</span>
                {plant.isMature ? (
                  <span className="text-amber-400 font-bold">Готово!</span>
                ) : (
                  <span>{Math.round(plant.moisture)}% 💧</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Plant Button */}
      {canPlantMore && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 flex flex-col items-center gap-2"
        >
          <button
            onClick={() => {
              onPlant(selectedType.id);
              haptic('medium');
              sound.buy();
            }}
            className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="text-xl">{selectedType.emoji}</span>
            <span>Посадить {selectedType.name}</span>
          </button>
          <p className="text-xs text-white/40">
            Слотов: {state.plants.length} / {3 + Math.floor((state.upgrades['sprinkler'] || 0) / 2)}
          </p>
        </motion.div>
      )}
    </div>
  );
}
