import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { detectSshKeyPath } from "../api/gitSwitch";
import type { GitProfile, ProfileFormValues } from "../types";
import { invokeErrorMessage } from "../utils/errors";

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
      setError(invokeErrorMessage(submitError, "Could not save profile."));
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

  async function handleDetectSshKey() {
    setError("");

    if (!values.name.trim()) {
      setError("Enter a profile name first (used to find id_ed25519_<name>).");
      return;
    }

    try {
      const detected = await detectSshKeyPath(values.name.trim());
      if (!detected) {
        setError(
          `No key found at ~/.ssh/id_ed25519_${values.name.trim().toLowerCase()}`,
        );
        return;
      }

      updateField("sshKey", detected);
    } catch (detectError) {
      setError(invokeErrorMessage(detectError, "Could not detect SSH key."));
    }
  }

  async function handleBrowseSshKey() {
    setError("");

    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: "Select SSH private key",
      });

      if (typeof selected === "string") {
        updateField("sshKey", selected);
      }
    } catch (browseError) {
      setError(invokeErrorMessage(browseError, "Could not open file picker."));
    }
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

        <label className="field">
          <span className="field-label">
            ssh private key file<span className="opt"> --optional</span>
          </span>
          <span className="input-wrap">
            <span className="prompt" aria-hidden="true">
              ssh&gt;
            </span>
            <input
              className="input"
              value={values.sshKey}
              onChange={(event) => updateField("sshKey", event.target.value)}
              placeholder="C:\\Users\\you\\.ssh\\id_ed25519_goat"
            />
          </span>
          <span className="hint">
            // expects ~/.ssh/id_ed25519_&lt;profile-name&gt; — use [ detect ] or
            [ browse ]
          </span>
          <div className="form-actions" style={{ borderTop: 0, paddingTop: 0 }}>
            <button
              type="button"
              className="btn"
              onClick={() => void handleDetectSshKey()}
            >
              [ detect ]
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void handleBrowseSshKey()}
            >
              [ browse ]
            </button>
          </div>
        </label>

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
