import { useCallback, useEffect, useState } from 'react';
import { api, type Activity, type JoinRequest } from '../api';
import { Stickman } from '../components/Stickman';
import { downloadIcs } from '../calendar';
import { formatWhen } from '../format';

type Hosted = { activity: Activity; requests: JoinRequest[] };
type Joined = { request: JoinRequest; activity: Activity | null };
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; hosted: Hosted[]; joined: Joined[] };

const STATUS_LABEL = { pending: 'Waiting for host', accepted: "You're in", rejected: 'Not this time' } as const;

/**
 * The backend currently returns only the requester's account id. Sample data
 * uses readable names; real ids (e.g. "auth0|abc") show as "A student" until
 * the API includes names.
 */
const requesterLabel = (userId: string) => (userId.includes('|') ? 'A student' : userId);

async function load(userId: string): Promise<{ hosted: Hosted[]; joined: Joined[] }> {
  const [all, mine] = await Promise.all([api.listActivities(), api.listMyRequests()]);
  const hosted = await Promise.all(
    all
      .filter((a) => a.creatorId === userId)
      .map(async (activity) => ({ activity, requests: await api.listRequestsFor(activity.id) })),
  );
  const joined = await Promise.all(
    mine.map(async (request) => ({
      request,
      // A cancelled activity returns 404; show it as no longer available.
      activity: await api.getActivity(request.activityId).catch(() => null),
    })),
  );
  return { hosted, joined };
}

export function MyActivities({ userId, refreshKey, onDiscover }: { userId: string; refreshKey: number; onDiscover: () => void }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(
    () =>
      load(userId)
        .then((data) => setState({ status: 'ready', ...data }))
        .catch((e: Error) => setState({ status: 'error', message: e.message })),
    [userId, refreshKey],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (id: string, run: () => Promise<unknown>) => {
    setBusy(id);
    setActionError(null);
    try {
      await run();
      await refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="page">
      <h1 className="page-title">My activities</h1>
      <p className="page-sub">
        Plans you're hosting and <strong>plans you've asked to join.</strong>
      </p>

      {actionError && (
        <p className="field-error mine-error" role="alert">
          {actionError}
        </p>
      )}
      {state.status === 'loading' && <p className="status">Loading your plans…</p>}
      {state.status === 'error' && (
        <p className="status status-error" role="alert">
          Couldn't load your activities: {state.message}
        </p>
      )}

      {state.status === 'ready' && (
        <>
          <h2 className="section-title">Hosting</h2>
          {state.hosted.length === 0 ? (
            <p className="status">You're not hosting anything yet.</p>
          ) : (
            <div className="mine-list">
              {state.hosted.map(({ activity, requests }) => {
                const pending = requests.filter((r) => r.status === 'pending');
                const going = requests.filter((r) => r.status === 'accepted');
                return (
                  <article key={activity.id} className="panel mine-item">
                    <header className="mine-head">
                      <div>
                        <h3 className="mine-title">{activity.name}</h3>
                        <p className="card-meta">
                          {formatWhen(activity.startTime, activity.endTime)} · {activity.location}
                        </p>
                      </div>
                      <span className="tag-count">{going.length} going</span>
                    </header>
                    {pending.length === 0 ? (
                      <p className="mine-empty">No new requests.</p>
                    ) : (
                      <ul className="request-list">
                        {pending.map((r) => (
                          <li key={r.id} className="request-row">
                            <span className="request-who">{requesterLabel(r.userId)}</span>
                            <span className="request-actions">
                              <button
                                className="pill pill-sm pill-active"
                                disabled={busy === r.id}
                                onClick={() => act(r.id, () => api.reviewRequest(r.id, 'accepted'))}
                              >
                                Accept
                              </button>
                              <button
                                className="pill pill-sm"
                                disabled={busy === r.id}
                                onClick={() => act(r.id, () => api.reviewRequest(r.id, 'rejected'))}
                              >
                                Decline
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <h2 className="section-title">Joining</h2>
          {state.joined.length === 0 ? (
            <div className="empty">
              <Stickman pose="point" />
              <p>
                You haven't asked to join anything yet.{' '}
                <button className="link" onClick={onDiscover}>
                  Find something on Discover
                </button>
              </p>
            </div>
          ) : (
            <div className="mine-list">
              {state.joined.map(({ request, activity }) => (
                <article key={request.id} className="panel mine-item">
                  <header className="mine-head">
                    <div>
                      <h3 className="mine-title">{activity?.name ?? 'No longer available'}</h3>
                      {activity && (
                        <p className="card-meta">
                          {formatWhen(activity.startTime, activity.endTime)} · {activity.location}
                        </p>
                      )}
                    </div>
                    <span className={`status-pill status-${request.status}`}>{STATUS_LABEL[request.status]}</span>
                  </header>
                  <div className="request-actions">
                    {request.status === 'accepted' && activity && (
                      <button className="pill pill-sm pill-active" onClick={() => downloadIcs(activity)}>
                        Add to calendar
                      </button>
                    )}
                    {request.status === 'pending' && (
                      <button
                        className="pill pill-sm"
                        disabled={busy === request.id}
                        onClick={() => act(request.id, () => api.cancelRequest(request.id))}
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
