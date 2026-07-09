"use client";

import { useState } from "react";
import { DefaultUserAvatar } from "./default-user-avatar";

export function UserAvatar({
  avatarUrl,
  className = "w-11 h-11",
}: {
  avatarUrl?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return <DefaultUserAvatar className={className} />;
}

export function UserAvatarButton({
  avatarUrl,
  className = "w-11 h-11",
}: {
  avatarUrl?: string | null;
  displayName?: string;
  className?: string;
}) {
  return (
    <UserAvatar avatarUrl={avatarUrl} className={className} />
  );
}
