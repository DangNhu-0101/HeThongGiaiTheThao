import Match from '../models/matches.js';

const SYNC_INTERVAL_MS = Math.max(10_000, Number(process.env.MATCH_STATUS_SYNC_INTERVAL_MS || 60_000));

export const syncLiveMatches = async (now = new Date()) => {
  const cutoff = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(cutoff.getTime())) return { modifiedCount: 0 };

  const result = await Match.updateMany(
    {
      status: 'pending',
      scheduledTime: { $ne: null, $lte: cutoff },
    },
    { $set: { status: 'live' } },
  );

  const modifiedCount = Number(result.modifiedCount || 0);
  if (modifiedCount > 0) {
    console.info('[matches.statusSync] pending matches moved to live', {
      modifiedCount,
      cutoff: cutoff.toISOString(),
    });
  }
  return { modifiedCount };
};

export const startMatchStatusScheduler = () => {
  const run = () => {
    syncLiveMatches().catch((error) => {
      console.error('[matches.statusSync] failed', error);
    });
  };
  run();
  const timer = setInterval(run, SYNC_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();
  console.info('[matches.statusSync] scheduler started', { intervalMs: SYNC_INTERVAL_MS });
  return timer;
};
