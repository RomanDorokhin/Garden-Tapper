import { motion } from 'framer-motion';
import type { GameState } from '@/types/game';

interface AchievementsScreenProps {
  state: GameState;
}

export function AchievementsScreen({ state }: AchievementsScreenProps) {
  const unlocked = state.achievements.filter((a) => a.unlocked);
  const locked = state.achievements.filter((a) => !a.unlocked);

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-24 px-4">
      <div className="pt-4 pb-2">
        <h2 className="text-2xl font-bold text-white text-center mb-1">🏆 Достижения</h2>
        <p className="text-center text-sm text-white/50">
          {unlocked.length} / {state.achievements.length} открыто
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/10 rounded-full mt-2 mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(unlocked.length / state.achievements.length) * 100}%` }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-2">Получено</h3>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {unlocked.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <div className="text-2xl">{a.emoji}</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{a.name}</div>
                  <div className="text-xs text-white/50">{a.description}</div>
                </div>
                <div className="text-amber-400 font-bold text-sm">+{a.reward}💰</div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Locked */}
      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2">В процессе</h3>
      <div className="grid grid-cols-1 gap-2">
        {locked.map((a, i) => {
          const pct = Math.min(100, (a.progress / a.requirement) * 100);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl opacity-50 grayscale">{a.emoji}</div>
                <div className="flex-1">
                  <div className="text-white/70 font-bold text-sm">{a.name}</div>
                  <div className="text-xs text-white/40">{a.description}</div>
                </div>
                <div className="text-amber-400/50 font-bold text-sm">+{a.reward}💰</div>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full bg-white/30 rounded-full"
                />
              </div>
              <div className="text-xs text-white/30 text-right">
                {a.progress} / {a.requirement}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
