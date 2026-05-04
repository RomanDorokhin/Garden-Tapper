import type { GameState } from '@/types/game';

interface StatsScreenProps {
  state: GameState;
  onReset: () => void;
}

export function StatsScreen({ state, onReset }: StatsScreenProps) {
  const playTimeHours = Math.floor(state.stats.playTime / 3600);
  const playTimeMinutes = Math.floor((state.stats.playTime % 3600) / 60);

  const stats = [
    { label: '💰 Монет', value: state.coins.toLocaleString() },
    { label: '📊 Уровень', value: state.level },
    { label: '✨ Опыт', value: `${state.xp} / ${state.xpToNext}` },
    { label: '🌾 Урожаев собрано', value: state.totalHarvests },
    { label: '💵 Всего заработано', value: state.totalCoinsEarned.toLocaleString() },
    { label: '👆 Всего тапов', value: state.totalTaps.toLocaleString() },
    { label: '🔥 Макс. комбо', value: `×${state.highestCombo}` },
    { label: '🌱 Растений открыто', value: `${state.plantsUnlocked.length} / 8` },
    { label: '🏆 Достижений', value: `${state.achievements.filter((a) => a.unlocked).length} / ${state.achievements.length}` },
    { label: '⏱️ Время в игре', value: `${playTimeHours}ч ${playTimeMinutes}м` },
    { label: '🔥 Серия дней', value: state.streakDays },
    { label: '🎮 Сессий', value: state.stats.sessions },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-24 px-4">
      <div className="pt-4 pb-2">
        <h2 className="text-2xl font-bold text-white text-center mb-1">📊 Статистика</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {stats.map((s, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center"
          >
            <div className="text-xs text-white/50 mb-1">{s.label}</div>
            <div className="text-lg font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <h3 className="text-red-400 font-bold text-sm mb-2">⚠️ Опасная зона</h3>
        <button
          onClick={onReset}
          className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm active:scale-95 transition-transform"
        >
          Сбросить прогресс
        </button>
      </div>
    </div>
  );
}
