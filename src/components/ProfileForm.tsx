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

interface FieldProps {
  label: string;
  prompt: string;
  optional?: boolean;
  children: React.ReactNode;
}

function Field({ label, prompt, optional, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {optional ? <span className="opt"> --optional</span> : null}
      </span>
      <span className="input-wrap">
        <span className="prompt" aria-hidden="true">
          {prompt}
        </span>
        {children}
      </span>
    </label>
  );
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
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="profile name" prompt="label>">
          <input
            className="input"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Account label"
            required
          />
        </Field>

        <Field label="git username" prompt="name>">
          <input
            className="input"
            value={values.userName}
            onChange={(event) => updateField("userName", event.target.value)}
            placeholder="Your Name"
            required
          />
        </Field>

        <Field label="git email" prompt="mail>">
          <input
            className="input"
            type="email"
            value={values.userEmail}
            onChange={(event) => updateField("userEmail", event.target.value)}
            placeholder="user@example.com"
            required
          />
        </Field>

        <Field label="ssh key path" prompt="ssh>" optional>
          <input
            className="input"
            value={values.sshKey}
            onChange={(event) => updateField("sshKey", event.target.value)}
            placeholder="C:\\path\\to\\private_key"
          />
        </Field>

        <Field label="gpg signing key" prompt="gpg>" optional>
          <input
            className="input"
            value={values.gpgKey}
            onChange={(event) => updateField("gpgKey", event.target.value)}
            placeholder="Key ID or fingerprint"
          />
        </Field>

        <Field label="default host" prompt="host>" optional>
          <input
            className="input"
            value={values.host}
            onChange={(event) => updateField("host", event.target.value)}
            placeholder="github.com"
          />
        </Field>
      </div>

      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          [ cancel ]
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "...saving" : submitLabel}
        </button>
      </div>
    </form>
  );
}
