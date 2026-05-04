import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GardenScreen } from './components/GardenScreen';
import { ShopScreen } from './components/ShopScreen';
import { CollectionScreen } from './components/CollectionScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { QuestsScreen } from './components/QuestsScreen';
import { StatsScreen } from './components/StatsScreen';
import { useGame } from './hooks/useGame';
import { useTelegram } from './hooks/useTelegram';

type Screen = 'garden' | 'shop' | 'collection' | 'achievements' | 'quests' | 'stats';

const TABS: { id: Screen; icon: string; label: string }[] = [
  { id: 'garden', icon: '🌱', label: 'Сад' },
  { id: 'shop', icon: '🏪', label: 'Магазин' },
  { id: 'collection', icon: '📚', label: 'Справочник' },
  { id: 'quests', icon: '📅', label: 'Награды' },
  { id: 'achievements', icon: '🏆', label: 'Награды' },
  { id: 'stats', icon: '📊', label: 'Стат' },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('garden');
  const game = useGame();
  const { haptic } = useTelegram();

  // Unlock notifications
  const [showUnlocks, setShowUnlocks] = useState(false);
  useEffect(() => {
    if (game.levelUps.length > 0) {
      setShowUnlocks(true);
      const t = setTimeout(() => setShowUnlocks(false), 4000);
      return () => clearTimeout(t);
    }
  }, [game.levelUps]);

  // Achievement notifications
  const [showAch, setShowAch] = useState(false);
  useEffect(() => {
    if (game.newUnlocks.length > 0) {
      setShowAch(true);
      const t = setTimeout(() => setShowAch(false), 3000);
      return () => clearTimeout(t);
    }
  }, [game.newUnlocks]);

  const switchScreen = useCallback(
    (s: Screen) => {
      setScreen(s);
      haptic('light');
    },
    [haptic]
  );

  return (
    <div className="w-full h-full bg-[#0d2010] text-white overflow-hidden flex flex-col relative">
      {/* Top HUD */}
      <div className="flex-shrink-0 z-20">
        <div className="flex justify-between items-center px-4 pt-3 pb-2 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-xs text-white/50 uppercase">монеты</span>
            <span className="text-base font-black text-amber-400">{game.state.coins.toLocaleString()}</span>
            <span className="text-sm">💰</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-xs text-white/50 uppercase">уровень</span>
            <span className="text-base font-black text-white">{game.state.level}</span>
            <span className="text-sm">⭐</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-xs text-white/50 uppercase">опыт</span>
            <span className="text-xs font-bold text-white/70">{game.state.xp}/{game.state.xpToNext}</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="px-4 pb-2">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-400 rounded-full"
              animate={{ width: `${(game.state.xp / game.state.xpToNext) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {screen === 'garden' && (
              <GardenScreen
                state={game.state}
                onWater={game.water}
                onHarvest={game.harvest}
                onPlant={game.plant}
                addFloatingText={game.addFloatingText}
              />
            )}
            {screen === 'shop' && <ShopScreen state={game.state} onBuy={game.buy} />}
            {screen === 'collection' && (
              <CollectionScreen state={game.state} onSelect={game.selectPlantType} />
            )}
            {screen === 'achievements' && <AchievementsScreen state={game.state} />}
            {screen === 'quests' && (
              <QuestsScreen
                state={game.state}
                onClaimDaily={game.claimDaily}
                onClaimQuest={game.claimQuest}
              />
            )}
            {screen === 'stats' && <StatsScreen state={game.state} onReset={game.reset} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating notifications */}
      <AnimatePresence>
        {showUnlocks && game.levelUps.length > 0 && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-purple-500/90 border border-purple-400/50 backdrop-blur-md text-center"
          >
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-white font-bold">Новый уровень!</div>
            <div className="text-purple-200 text-sm mt-1">
              Разблокировано: {game.levelUps.map((p) => p.emoji + ' ' + p.name).join(', ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAch && game.newUnlocks.length > 0 && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-amber-500/90 border border-amber-400/50 backdrop-blur-md text-center"
          >
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-white font-bold">Достижение!</div>
            <div className="text-amber-200 text-sm mt-1">
              {game.newUnlocks[game.newUnlocks.length - 1]?.name}
            </div>
            <div className="text-amber-300 text-xs font-bold mt-1">
              +{game.newUnlocks[game.newUnlocks.length - 1]?.reward}💰
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event notification */}
      <AnimatePresence>
        {game.eventNotif && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
          >
            <span className="text-white font-bold text-sm">
              {game.eventNotif.emoji} {game.eventNotif.name} началось!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="flex-shrink-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-4 pb-6 px-2">
        <div className="flex justify-around items-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchScreen(tab.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
                screen === tab.id ? 'text-white' : 'text-white/40'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-bold uppercase">{tab.label}</span>
              {screen === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="w-6 h-0.5 bg-amber-400 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Floating texts overlay */}
      {game.floatingTexts.map((ft) => (
        <motion.div
          key={ft.id}
          initial={{ y: ft.y, x: ft.x, opacity: 1 }}
          animate={{ y: ft.y - 60, opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="fixed pointer-events-none z-40 text-lg font-bold"
          style={{ color: ft.color, left: ft.x, top: ft.y }}
        >
          {ft.text}
        </motion.div>
      ))}
    </div>
  );
}
