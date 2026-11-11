import { useEffect, useState } from 'react';
import { api, type Activity, type ActivityType } from '../api';
import { ActivityCard } from '../components/ActivityCard';
import { Stickman } from '../components/Stickman';
import { SCHOOLS, formatHeaderDate } from '../format';

type Filter = 'for-you' | 'all' | ActivityType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'for-you', label: 'For you' },
  { value: 'study', label: 'Study' },
  { value: 'food', label: 'Food' },
  { value: 'all', label: 'All' },
];

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; activities: Activity[] };

const load = (filter: Filter) =>
  filter === 'for-you'
    ? api.getRecommendations()
    : api.listActivities(filter === 'all' ? {} : { type: filter });

export function Discover({ schoolId, refreshKey }: { schoolId: number | null; refreshKey: number }) {
  const [filter, setFilter] = useState<Filter>('for-you');
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    load(filter)
      .then((activities) => !cancelled && setState({ status: 'ready', activities }))
      .catch((e: Error) => !cancelled && setState({ status: 'error', message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey]);

  const choose = (value: Filter) => {
    if (value === filter) return;
    setState({ status: 'loading' });
    setFilter(value);
  };

  return (
    <section className="page">
      <div className="discover-head">
        <div>
          <h1 className="page-title">{formatHeaderDate()}</h1>
          {schoolId && <p className="mono-label">{SCHOOLS[schoolId]}</p>}
        </div>
        <div className="filters" role="group" aria-label="Filter activities">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              className={`pill pill-sm ${filter === value ? 'pill-active' : ''}`}
              aria-pressed={filter === value}
              onClick={() => choose(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {state.status === 'loading' && <p className="status">Finding activities…</p>}
      {state.status === 'error' && (
        <p className="status status-error" role="alert">
          Couldn't load activities: {state.message}
        </p>
      )}
      {state.status === 'ready' && state.activities.length === 0 && (
        <div className="empty">
          <Stickman pose="point" />
          <p>Nothing here yet. Be the first to create an activity.</p>
        </div>
      )}
      {state.status === 'ready' && state.activities.length > 0 && (
        <div className="card-grid">
          {state.activities.map((activity, i) => (
            <ActivityCard key={activity.id} activity={activity} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
