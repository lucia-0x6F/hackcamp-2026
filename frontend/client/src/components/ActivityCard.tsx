import { useState } from 'react';
import { api, type Activity } from '../api';
import { formatWhen } from '../format';

const COLORS = ['pink', 'mint', 'orange'] as const;
const BACKS = { pink: 'mint', mint: 'yellow', orange: 'pink' } as const;

type JoinState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'requested' } | { kind: 'error'; message: string };

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const [join, setJoin] = useState<JoinState>({ kind: 'idle' });
  const color = COLORS[index % COLORS.length];

  const requestToJoin = async () => {
    setJoin({ kind: 'sending' });
    try {
      await api.requestToJoin(activity.id);
      setJoin({ kind: 'requested' });
    } catch (e) {
      setJoin({ kind: 'error', message: (e as Error).message });
    }
  };

  const label = { idle: 'Join', sending: 'Sending…', requested: 'Requested', error: 'Try again' }[join.kind];

  return (
    <div className="card-wrap">
      <div className={`card-back bg-${BACKS[color]}`} aria-hidden="true" />
      <article className={`card card-${color}`}>
        <h3 className="card-title">
          <span className="card-num">{String(index + 1).padStart(2, '0')}</span>
          {activity.name}
        </h3>
        <div className="card-meta">
          <p className="card-time">{formatWhen(activity.startTime, activity.endTime)}</p>
          <p>{activity.location}</p>
        </div>
        {join.kind === 'error' && (
          <p className="card-error" role="alert">
            {join.message}
          </p>
        )}
        <button
          className="card-join"
          onClick={requestToJoin}
          disabled={join.kind === 'sending' || join.kind === 'requested'}
          aria-label={`${label}: ${activity.name}`}
        >
          {label}
        </button>
      </article>
    </div>
  );
}
