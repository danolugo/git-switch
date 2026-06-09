import { useState } from "react";
import type { GitProfile, ProfileFormValues } from "../types";

interface ProfileFormProps {
  initial?: GitProfile;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

const EMPTY_FORM: ProfileFormValues = {
  name: "",
  userName: "",
  userEmail: "",
  sshKey: "",
  gpgKey: "",
  host: "",
};

function toFormValues(profile?: GitProfile): ProfileFormValues {
  if (!profile) {
    return EMPTY_FORM;
  }

  return {
    name: profile.name,
    userName: profile.userName,
    userEmail: profile.userEmail,
    sshKey: profile.sshKey ?? "",
    gpgKey: profile.gpgKey ?? "",
    host: profile.host ?? "",
  };
}

export function ProfileForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(toFormValues(initial));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Profile name
          <input
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Work"
            required
          />
        </label>

        <label>
          Git username
          <input
            value={values.userName}
            onChange={(event) => updateField("userName", event.target.value)}
            placeholder="Giordano Lugo"
            required
          />
        </label>

        <label>
          Git email
          <input
            type="email"
            value={values.userEmail}
            onChange={(event) => updateField("userEmail", event.target.value)}
            placeholder="g.lugo@company.com"
            required
          />
        </label>

        <label>
          SSH key path (optional)
          <input
            value={values.sshKey}
            onChange={(event) => updateField("sshKey", event.target.value)}
            placeholder="C:\\Users\\you\\.ssh\\id_ed25519_work"
          />
        </label>

        <label>
          GPG signing key (optional)
          <input
            value={values.gpgKey}
            onChange={(event) => updateField("gpgKey", event.target.value)}
            placeholder="Key ID or fingerprint"
          />
        </label>

        <label>
          Default host (optional)
          <input
            value={values.host}
            onChange={(event) => updateField("host", event.target.value)}
            placeholder="github.com"
          />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
