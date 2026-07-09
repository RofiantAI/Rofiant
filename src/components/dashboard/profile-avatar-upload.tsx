"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import { UserAvatar } from "./user-avatar-button";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export function ProfileAvatarUpload({
  userId,
  avatarUrl: initialAvatarUrl,
  hasCustomAvatar,
  displayName,
  email,
}: {
  userId: string;
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  displayName: string;
  email: string;
}) {
  const router = useRouter();
  const t = useTranslations("dashboard.settings.account");
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [custom, setCustom] = useState(hasCustomAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
    setCustom(hasCustomAvatar);
  }, [initialAvatarUrl, hasCustomAvatar]);

  async function handleUpload(file: File) {
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError(t("photoInvalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("photoTooLarge"));
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploading(false);
      setError(t("photoUploadError", { message: uploadError.message }));
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { custom_avatar_url: url },
    });

    setUploading(false);
    if (updateError) {
      setError(t("photoUploadError", { message: updateError.message }));
      return;
    }

    setAvatarUrl(url);
    setCustom(true);
    router.refresh();
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    const supabase = createClient();

    const { data: files } = await supabase.storage.from("avatars").list(userId);
    if (files?.length) {
      await supabase.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { custom_avatar_url: "" },
    });

    setUploading(false);
    if (updateError) {
      setError(t("photoUploadError", { message: updateError.message }));
      return;
    }

    setCustom(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setAvatarUrl(user ? getUserAvatarUrl(user) : null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar avatarUrl={avatarUrl} className="w-14 h-14" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{displayName || email}</p>
        <p className="text-xs text-foreground-muted mt-0.5">{email}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors"
          >
            {uploading ? t("photoUploading") : t("photoUpload")}
          </button>
          {custom && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => void handleRemove()}
              className="h-8 px-3 text-xs font-medium border border-border text-foreground-secondary hover:text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
            >
              {t("photoRemove")}
            </button>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-2">{t("photoHint")}</p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  );
}
