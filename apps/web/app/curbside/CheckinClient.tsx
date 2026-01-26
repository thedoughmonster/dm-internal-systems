"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./curbside.module.css";

type Status = "idle" | "loading" | "success" | "already_checked_in" | "error";

const POST_URL = process.env.NEXT_PUBLIC_TOAST_CHECKIN_POST_URL;

export default function CheckinClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [requestError, setRequestError] = useState<string | null>(null);

  const checkin = useMemo(() => searchParams.get("checkin") ?? "", [searchParams]);
  const hasCheckin = checkin.length > 0;
  const postUrl = useMemo(() => {
    if (!POST_URL) {
      return null;
    }
    try {
      const url = new URL(POST_URL, window.location.origin);
      if (checkin) {
        url.searchParams.set("checkin", checkin);
      }
      return url.toString();
    } catch {
      return null;
    }
  }, [checkin]);
  const hasPostUrl = Boolean(postUrl);

  const configError = useMemo(() => {
    if (!hasPostUrl) {
      return "Check-in is not configured. Please try again later.";
    }
    if (!hasCheckin) {
      return "Missing check-in token. Check your link.";
    }
    return null;
  }, [hasCheckin, hasPostUrl]);

  const disabled =
    !hasCheckin ||
    !hasPostUrl ||
    status === "loading" ||
    status === "success" ||
    status === "already_checked_in";

  const buttonLabel =
    status === "loading"
      ? "Checking in..."
      : status === "success"
      ? "Checked in"
      : "I'm here";

  const errorMessage = configError ?? requestError;

  const handleClick = async () => {
    if (disabled || !postUrl) {
      return;
    }
    setStatus("loading");
    setRequestError(null);
    try {
      const resp = await fetch(postUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderGuid: checkin,
          userAgent: navigator.userAgent,
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error ?? "Check-in failed");
      }
      if (data?.status === "already_checked_in") {
        setStatus("already_checked_in");
      } else if (data?.status === "checked_in") {
        setStatus("success");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setRequestError("Could not check in. Please try again.");
    }
  };

  return (
    <>
      <button className={styles.button} disabled={disabled} onClick={handleClick}>
        {buttonLabel}
      </button>
      {status === "success" && (
        <div className={styles.ok}>Checked in. Kitchen notified.</div>
      )}
      {status === "already_checked_in" && (
        <div className={styles.ok}>Already checked in. Kitchen already notified.</div>
      )}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </>
  );
}
