import type { GitProfile } from "../types";

interface ProfileBadgeProps {
  profile: GitProfile;
  size?: "sm" | "md";
}

export function ProfileBadge({ profile, size = "md" }: ProfileBadgeProps) {
  const color = profile.color ?? "#33ff00";
  const icon = profile.icon ?? profile.name.slice(0, 2).toLowerCase();

  return (
    <span
      className={`profile-badge ${size === "sm" ? "sm" : ""}`.trim()}
      style={{ borderColor: color, color }}
    >
      {icon}
    </span>
  );
}
