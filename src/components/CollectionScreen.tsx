import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '@/types/game';
import { PLANT_TYPES } from '@/types/game';

interface CollectionScreenProps {
  state: GameState;
  onSelect: (typeId: string) => void;
}

export function CollectionScreen({ state, onSelect }: CollectionScreenProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filtered = PLANT_TYPES.filter((p) => {
    if (filter === 'unlocked') return state.plantsUnlocked.includes(p.id);
    if (filter === 'locked') return !state.plantsUnlocked.includes(p.id);
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-24 px-4">
      <div className="sticky top-0 z-10 bg-[#0d2010]/95 backdrop-blur-md pt-4 pb-2">
        <h2 className="text-2xl font-bold text-white text-center mb-3">📚 Энциклопедия</h2>
        <div className="flex gap-2 justify-center">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'unlocked' ? 'Открыты' : 'Закрыты'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3">
        {filtered.map((plant, i) => {
          const unlocked = state.plantsUnlocked.includes(plant.id);
          const rarityColors = {
            common: 'border-white/10',
            rare: 'border-blue-400/30',
            epic: 'border-purple-400/30',
            legendary: 'border-amber-400/30',
          };
          const rarityBg = {
            common: 'bg-white/5',
            rare: 'bg-blue-500/5',
            epic: 'bg-purple-500/5',
            legendary: 'bg-amber-500/5',
          };

          return (
            <motion.div
              key={plant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => unlocked && onSelect(plant.id)}
              className={`relative p-4 rounded-2xl border transition-all ${
                unlocked ? `${rarityBg[plant.rarity]} ${rarityColors[plant.rarity]} active:scale-95` : 'bg-white/3 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                  unlocked ? 'bg-white/10' : 'bg-white/5'
                }`}>
                  {unlocked ? plant.emoji : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{plant.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      plant.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400' :
                      plant.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                      plant.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {plant.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{unlocked ? plant.description : 'Разблокируется на уровне ' + plant.unlockLevel}</p>
                  {unlocked && (
                    <div className="flex gap-3 mt-1 text-xs text-white/40">
                      <span>💰 {plant.baseYield}</span>
                      <span>⏱️ {Math.round(plant.growTime / 60)}м</span>
                      <span>💧 {Math.round(plant.waterConsumption * 100) / 100}/с</span>
                    </div>
                  )}
                </div>
                {unlocked && (
                  <div className={`w-3 h-3 rounded-full ${
                    state.selectedPlantType === plant.id ? 'bg-green-400' : 'bg-white/20'
                  }`} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
