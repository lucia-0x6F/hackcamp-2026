import { useState } from "react";
import { ACTIVITY_TYPES, api, type Profile as ProfileData } from "../api";
import { Stickman } from "../components/Stickman";
import { SCHOOLS } from "../format";

// Same fields and save behaviour as the original App.tsx profile form.
const YEARS: ProfileData["schoolYear"][] = [
  "first",
  "second",
  "third",
  "fourth",
  "fourth+",
  "graduate",
];
const PRONOUNS: NonNullable<ProfileData["pronoun"]>[] = ["she/her", "he/him", "they/them", "prefer not to say"];

export function Profile({
  initial,
  onSaved,
}: {
  initial: ProfileData;
  onSaved: (p: ProfileData) => void;
}) {
  const [profile, setProfile] = useState<ProfileData>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const saved = await api.saveProfile(profile);
      onSaved(saved ?? profile);
      setMessage("Profile saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page">
      <Stickman pose="wave" className="page-stick" />
      <h1 className="page-title">Your profile</h1>
      <p className="page-sub">
        Tell us what you're into so we can find{" "}
        <strong>people to go with.</strong>
      </p>
      <div className="profile-layout">
        <div className="profile-note">
          <div className="card-back" aria-hidden="true" />
          <div className="card">
            <p className="mono-label">{SCHOOLS[profile.schoolId]}</p>
            <h2 className="profile-name">{profile.name || "Your name"}</h2>
            <p className="card-meta">
              {profile.schoolYear} year
              {profile.major ? ` · ${profile.major}` : ""}
            </p>
            {(profile.interestedTypes.length > 0 ||
              profile.hobbies.length > 0) && (
              <div className="tag-list">
                {[...profile.interestedTypes, ...profile.hobbies].map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <form className="panel form" onSubmit={submit}>
          {message && (
            <p className="status" role="status">
              {message}
            </p>
          )}
          <label>
            Name
            <input
              required
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <label>
            School
            <select
              value={profile.schoolId}
              onChange={(e) => update("schoolId", Number(e.target.value))}
            >
              <option value={1}>University of British Columbia</option>
              <option value={2}>Simon Fraser University</option>
              <option value={3}>University of Victoria</option>
            </select>
          </label>
          <label>
            Pronouns <span className="optional">optional</span>
            <select value={profile.pronoun ?? ""} onChange={(e) => update("pronoun", (e.target.value || null) as ProfileData["pronoun"])}>
              <option value="">Prefer not to share</option>
              {PRONOUNS.map((pronoun) => <option key={pronoun} value={pronoun}>{pronoun}</option>)}
            </select>
          </label>
          <label>
            School year
            <select
              value={profile.schoolYear}
              onChange={(e) =>
                update(
                  "schoolYear",
                  e.target.value as ProfileData["schoolYear"],
                )
              }
            >
              {YEARS.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <label>
            Major
            <input
              value={profile.major ?? ""}
              onChange={(e) => update("major", e.target.value || null)}
            />
          </label>
          <label>
            Hobbies
            <input
              value={profile.hobbies.join(", ")}
              onChange={(e) =>
                update(
                  "hobbies",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
              placeholder="hiking, music, cooking"
            />
          </label>
          <fieldset>
            <legend>Interested in</legend>
            <div className="choices">
              {ACTIVITY_TYPES.map((type) => (
                <label key={type} className="choice">
                  <input
                    type="checkbox"
                    checked={profile.interestedTypes.includes(type)}
                    onChange={(e) =>
                      update(
                        "interestedTypes",
                        e.target.checked
                          ? [...profile.interestedTypes, type]
                          : profile.interestedTypes.filter((v) => v !== type),
                      )
                    }
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="cta" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </section>
  );
}
