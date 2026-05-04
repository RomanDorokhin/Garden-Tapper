import { motion } from 'framer-motion';
import type { GameState } from '@/types/game';
import { getDailyReward } from '@/lib/gameEngine';

interface QuestsScreenProps {
  state: GameState;
  onClaimDaily: () => void;
  onClaimQuest: (id: string) => void;
}

export function QuestsScreen({ state, onClaimDaily, onClaimQuest }: QuestsScreenProps) {
  const dailyResult = getDailyReward(state);
  const canClaimDaily = dailyResult !== null;
  const dailyReward = dailyResult?.reward || 0;
  const isStreak = dailyResult?.isStreak || false;

  // Calculate time until next daily
  const now = Date.now();
  const lastDay = new Date(state.lastDailyReward);
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const lastDayStart = new Date(lastDay).setHours(0, 0, 0, 0);
  const alreadyClaimedToday = todayStart === lastDayStart;

  const hoursUntilNext = alreadyClaimedToday
    ? Math.ceil((new Date(todayStart + 86400000).getTime() - now) / 3600000)
    : 0;

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-24 px-4">
      <div className="pt-4 pb-2">
        <h2 className="text-2xl font-bold text-white text-center mb-1">📅 Награды</h2>
      </div>

      {/* Daily Reward Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`p-5 rounded-2xl border text-center mb-4 transition-all ${
          canClaimDaily
            ? 'bg-amber-500/10 border-amber-400/30'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <div className="text-4xl mb-2">🎁</div>
        <h3 className="text-lg font-bold text-white mb-1">Ежедневная награда</h3>
        <p className="text-sm text-white/60 mb-3">
          {canClaimDaily
            ? isStreak
              ? `🔥 Серия ${state.streakDays + 1} дней!`
              : 'Заберите свою награду!'
            : `Следующая награда через ${hoursUntilNext}ч`}
        </p>

        {canClaimDaily && (
          <button
            onClick={onClaimDaily}
            className="px-6 py-3 rounded-xl bg-amber-400 text-black font-bold text-lg active:scale-95 transition-transform"
          >
            Забрать {dailyReward}💰
          </button>
        )}

        {!canClaimDaily && (
          <div className="text-amber-400/50 font-bold text-lg">✓ Получено</div>
        )}
      </motion.div>

      {/* Quests */}
      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2">Ежедневные задания</h3>
      <div className="grid grid-cols-1 gap-2">
        {state.quests.map((q, i) => {
          const pct = Math.min(100, (q.current / q.target) * 100);
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-xl border transition-all ${
                q.claimed
                  ? 'bg-green-500/10 border-green-500/20'
                  : q.completed
                  ? 'bg-amber-500/10 border-amber-400/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{q.name}</div>
                  <div className="text-xs text-white/50">{q.description}</div>
                </div>
                <div className="text-amber-400 font-bold text-sm">{q.reward}💰</div>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${
                    q.completed ? 'bg-green-400' : 'bg-amber-400'
                  }`}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">
                  {Math.min(q.current, q.target)} / {q.target}
                </span>
                {q.completed && !q.claimed && (
                  <button
                    onClick={() => onClaimQuest(q.id)}
                    className="px-3 py-1 rounded-lg bg-amber-400 text-black text-xs font-bold active:scale-95 transition-transform"
                  >
                    Забрать
                  </button>
                )}
                {q.claimed && (
                  <span className="text-xs text-green-400 font-bold">✓ Выполнено</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
