import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '@/types/game';
import { PLANT_TYPES, UPGRADES } from '@/types/game';
import { useTelegram, useSound } from '@/hooks/useTelegram';
import { getUpgradeCost, getUpgradeEffect } from '@/lib/gameEngine';

interface ShopScreenProps {
  state: GameState;
  onBuy: (id: string) => void;
}

export function ShopScreen({ state, onBuy }: ShopScreenProps) {
  const { hapticSuccess, hapticError } = useTelegram();
  const sound = useSound();
  const [activeTab, setActiveTab] = useState<'upgrades' | 'plants'>('upgrades');

  const handleBuy = (id: string) => {
    const cost = getUpgradeCost(id, state.upgrades[id] || 0);
    if (state.coins >= cost) {
      onBuy(id);
      hapticSuccess();
      sound.buy();
    } else {
      hapticError();
      sound.error();
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-24 px-4">
      <div className="sticky top-0 z-10 bg-[#0d2010]/95 backdrop-blur-md pt-4 pb-2">
        <h2 className="text-2xl font-bold text-white text-center mb-3">🏪 Магазин</h2>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'upgrades' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            Улучшения
          </button>
          <button
            onClick={() => setActiveTab('plants')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'plants' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            Растения
          </button>
        </div>
      </div>

      {activeTab === 'upgrades' && (
        <div className="grid grid-cols-1 gap-3 mt-3">
          {UPGRADES.map((up, i) => {
            const level = state.upgrades[up.id] || 0;
            const cost = getUpgradeCost(up.id, level);
            const canBuy = state.coins >= cost && level < up.maxLevel;
            const owned = level > 0;

            return (
              <motion.div
                key={up.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleBuy(up.id)}
                className={`relative p-4 rounded-2xl border transition-all active:scale-95 ${
                  canBuy
                    ? 'bg-white/10 border-white/20'
                    : owned
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {up.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{up.name}</span>
                      {level > 0 && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                          Ур. {level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">{up.description}</p>
                    <div className="text-xs text-white/40 mt-1">
                      Эффект: +{Math.round(getUpgradeEffect(up.id, level + 1) * 10) / 10}
                    </div>
                  </div>
                  <div className="text-right">
                    {level < up.maxLevel ? (
                      <>
                        <div className="text-amber-400 font-bold text-lg">{cost}💰</div>
                        <div className="text-xs text-white/40">
                          {up.maxLevel - level} осталось
                        </div>
                      </>
                    ) : (
                      <div className="text-green-400 font-bold">МАКС ✓</div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'plants' && (
        <div className="grid grid-cols-1 gap-3 mt-3">
          {state.plantsUnlocked.map((pid, i) => {
            const plantType = PLANT_TYPES.find((p) => p.id === pid);
            if (!plantType) return null;
            return (
                <motion.div
                  key={pid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{plantType.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{plantType.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          plantType.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400' :
                          plantType.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                          plantType.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {plantType.rarity}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">{plantType.description}</div>
                      <div className="text-xs text-amber-400 mt-1">Доход: {plantType.baseYield}💰</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
      )}
    </div>
  );
}
