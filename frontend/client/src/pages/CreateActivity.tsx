import { useState } from 'react';
import { ACTIVITY_TYPES, api, type ActivityType } from '../api';
import { Stickman } from '../components/Stickman';
import { formatWhen } from '../format';

const TYPE_COLORS: Record<ActivityType, string> = {
  study: 'pink',
  food: 'orange',
  sports: 'mint',
  career: 'yellow',
  other: 'olive',
};

type Draft = {
  name: string;
  type: ActivityType;
  location: string;
  date: string;
  start: string;
  end: string;
  description: string;
  link: string;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyDraft = (): Draft => ({ name: '', type: 'study', location: '', date: today(), start: '', end: '', description: '', link: '' });

/** Local date + time inputs → ISO string; end defaults to two hours after start, like the backend's TimeRange. */
function toTimes(d: Draft): { startTime: string; endTime: string } | null {
  if (!d.date || !d.start) return null;
  const start = new Date(`${d.date}T${d.start}`);
  const end = d.end ? new Date(`${d.date}T${d.end}`) : new Date(start.getTime() + 2 * 3600_000);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

function validate(d: Draft): string | null {
  if (!d.name.trim()) return 'Give your activity a title.';
  if (d.name.trim().length > 100) return 'Keep the title under 100 characters.';
  if (!d.location.trim()) return 'Add where you are meeting.';
  const times = toTimes(d);
  if (!times) return 'Pick a date and start time.';
  if (new Date(times.startTime) <= new Date()) return 'Pick a time in the future.';
  if (times.endTime <= times.startTime) return 'End time must be after the start time.';
  if (d.description.length > 500) return 'Keep the description under 500 characters.';
  if (d.link && !/^https?:\/\//i.test(d.link.trim())) return 'Links must start with http:// or https://';
  return null;
}

type Status = { kind: 'editing' } | { kind: 'saving' } | { kind: 'error'; message: string } | { kind: 'done' };

export function CreateActivity({ onCreated, onViewDiscover }: { onCreated: () => void; onViewDiscover: () => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'editing' });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const error = validate(draft);
  const times = toTimes(draft);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (error || !times) return;
    setStatus({ kind: 'saving' });
    try {
      await api.createActivity({
        name: draft.name.trim(),
        type: draft.type,
        location: draft.location.trim(),
        description: draft.description.trim(),
        link: draft.link.trim() || null,
        ...times,
      });
      onCreated();
      setStatus({ kind: 'done' });
    } catch (e) {
      setStatus({ kind: 'error', message: (e as Error).message });
    }
  };

  if (status.kind === 'done') {
    return (
      <section className="page">
        <div className="created">
          <Stickman pose="highfive" />
          <h1 className="page-title">You're on!</h1>
          <p className="page-sub">
            <strong>{draft.name.trim()}</strong> is live. We'll let you know when people ask to join.
          </p>
          <div className="created-actions">
            <button className="cta" onClick={onViewDiscover}>
              See it on Discover <span className="cta-arrow" aria-hidden="true">→</span>
            </button>
            <button
              className="pill"
              onClick={() => {
                setDraft(emptyDraft());
                setTouched(false);
                setStatus({ kind: 'editing' });
              }}
            >
              Create another
            </button>
          </div>
        </div>
      </section>
    );
  }

  const color = TYPE_COLORS[draft.type];

  return (
    <section className="page">
      <h1 className="page-title">Create your plan</h1>
      <p className="page-sub">
        Post what you're up to and <strong>let people join you.</strong>
      </p>

      <div className="create-layout">
        <aside className="preview-panel" aria-label="Preview">
          <p className="mono-label preview-label">Preview</p>
          <div className="card-wrap preview-card">
            <div className="card-back bg-cream" aria-hidden="true" />
            <article className={`card card-${color} bg-${color}`}>
              <h3 className="card-title">{draft.name.trim() || 'Your activity title'}</h3>
              <div className="card-meta">
                <p>{times ? formatWhen(times.startTime, times.endTime) : 'Date · time'}</p>
                <p>{draft.location.trim() || 'Location'}</p>
              </div>
              {draft.description.trim() && <p className="preview-desc">{draft.description.trim()}</p>}
              <span className="card-join" aria-hidden="true">
                Join
              </span>
            </article>
          </div>
          <Stickman pose="point" className="preview-stick" />
        </aside>

        <form className="panel form" onSubmit={submit} noValidate>
          <label>
            Activity title
            <input value={draft.name} maxLength={100} onChange={(e) => set('name', e.target.value)} placeholder="e.g. COMM 293 study session" />
          </label>

          <fieldset>
            <legend>Category</legend>
            <div className="choices">
              {ACTIVITY_TYPES.map((type) => (
                <label key={type} className={`choice choice-${TYPE_COLORS[type]}`}>
                  <input type="radio" name="type" checked={draft.type === type} onChange={() => set('type', type)} />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            Meeting spot
            <input value={draft.location} maxLength={200} onChange={(e) => set('location', e.target.value)} placeholder="e.g. IKB, Floor 3" />
          </label>

          <div className="form-row">
            <label>
              Date
              <input type="date" value={draft.date} min={today()} onChange={(e) => set('date', e.target.value)} />
            </label>
            <label>
              Start
              <input type="time" value={draft.start} onChange={(e) => set('start', e.target.value)} />
            </label>
            <label>
              End <span className="optional">optional</span>
              <input type="time" value={draft.end} onChange={(e) => set('end', e.target.value)} />
            </label>
          </div>

          <label>
            Description <span className="optional">{draft.description.length}/500</span>
            <textarea
              rows={3}
              value={draft.description}
              maxLength={500}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What are you doing? Who should come?"
            />
          </label>

          <label>
            Event link <span className="optional">optional</span>
            <input type="url" value={draft.link} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
          </label>

          {touched && error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {status.kind === 'error' && (
            <p className="field-error" role="alert">
              Couldn't post it: {status.message}
            </p>
          )}

          <button className="cta" disabled={status.kind === 'saving'}>
            {status.kind === 'saving' ? 'Posting…' : 'Post activity'} <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </section>
  );
}
