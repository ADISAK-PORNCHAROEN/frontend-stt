"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRemoteJob, getServiceHealth, getTranscript, submitFile } from "../api";
import { MAX_FILE_DURATION_SECONDS, MAX_FILE_BYTES } from "../constants";
import type { JobId, MediaFile, ServiceState, WorkspaceSession } from "../types";

function getJobId(session: WorkspaceSession): JobId | null {
  return session.kind === "queued" || session.kind === "running" || session.kind === "succeeded" || session.kind === "failed"
    ? session.jobId
    : null;
}

export function useTranscriptionSession() {
  const [session, setSession] = useState<WorkspaceSession>({ kind: "empty" });
  const [serviceState, setServiceState] = useState<ServiceState>("checking");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const sessionIdentity = useRef(0);
  const healthRequestIdentity = useRef(0);
  const mounted = useRef(true);
  const uploadController = useRef<AbortController | null>(null);
  const ownedObjectUrl = useRef<string | null>(null);

  const isCurrentSession = useCallback(
    (identity: number) => mounted.current && sessionIdentity.current === identity,
    [],
  );

  const releaseObjectUrl = useCallback(() => {
    const url = ownedObjectUrl.current;
    ownedObjectUrl.current = null;
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sessionIdentity.current += 1;
      healthRequestIdentity.current += 1;
      uploadController.current?.abort();
      uploadController.current = null;
      releaseObjectUrl();
    };
  }, [releaseObjectUrl]);

  const checkService = useCallback(async () => {
    const identity = ++healthRequestIdentity.current;
    setServiceState("checking");
    try {
      const health = await getServiceHealth();
      if (!mounted.current || identity !== healthRequestIdentity.current) return;
      setServiceState(health.ready ? "ready" : "unavailable");
      if (health.ready) setJobMessage(null);
    } catch {
      if (mounted.current && identity === healthRequestIdentity.current) setServiceState("unavailable");
    }
  }, []);

  useEffect(() => {
    const identity = ++healthRequestIdentity.current;
    void getServiceHealth().then((health) => {
      if (mounted.current && identity === healthRequestIdentity.current) {
        setServiceState(health.ready ? "ready" : "unavailable");
      }
    }).catch(() => {
      if (mounted.current && identity === healthRequestIdentity.current) setServiceState("unavailable");
    });
    return () => {
      if (healthRequestIdentity.current === identity) healthRequestIdentity.current += 1;
    };
  }, []);

  useEffect(() => {
    if (session.kind !== "submitting" && session.kind !== "queued" && session.kind !== "running") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [session.kind]);

  const activeJobId = getJobId(session);
  useEffect(() => {
    if (!activeJobId || (session.kind !== "queued" && session.kind !== "running")) return;
    const identity = sessionIdentity.current;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canUpdate = () => !cancelled && isCurrentSession(identity);

    const poll = async () => {
      try {
        const job = await getRemoteJob(activeJobId);
        if (!canUpdate()) return;
        setJobMessage(null);
        if (job.status === "succeeded") {
          const transcript = await getTranscript(activeJobId);
          if (canUpdate()) {
            setSession((current) => canUpdate() && current.kind !== "empty" && current.kind !== "selected" && current.kind !== "submitting" && current.jobId === activeJobId
              ? { ...current, kind: "succeeded", jobId: activeJobId, transcript }
              : current);
          }
          return;
        }
        if (job.status === "failed") {
          setSession((current) => canUpdate() && current.kind !== "empty" && current.kind !== "selected" && current.kind !== "submitting" && current.jobId === activeJobId
            ? { ...current, kind: "failed", jobId: activeJobId, message: job.message }
            : current);
          return;
        }
        if (job.status === "queued") {
          setSession((current) => canUpdate() && current.kind !== "empty" && current.kind !== "selected" && current.kind !== "submitting" && current.jobId === activeJobId
            ? { ...current, kind: "queued", jobId: activeJobId, progressPercent: job.progressPercent }
            : current);
        } else {
          setSession((current) => canUpdate() && current.kind !== "empty" && current.kind !== "selected" && current.kind !== "submitting" && current.jobId === activeJobId
            ? { ...current, kind: "running", jobId: activeJobId, progressPercent: job.progressPercent }
            : current);
        }
        timer = setTimeout(() => void poll(), 1100);
      } catch (error) {
        if (canUpdate()) {
          setJobMessage(error instanceof Error ? error.message : "ติดตามงานไม่ได้ กรุณาลองใหม่");
          timer = setTimeout(() => void poll(), 2500);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeJobId, isCurrentSession, session.kind]);

  const selectFile = useCallback((file: File) => {
    sessionIdentity.current += 1;
    uploadController.current?.abort();
    uploadController.current = null;
    const url = URL.createObjectURL(file);
    releaseObjectUrl();
    ownedObjectUrl.current = url;
    setSelectionError(null);
    setJobMessage(null);
    setSession({ kind: "selected", file, url, durationSeconds: null });
  }, [releaseObjectUrl]);

  const clearSession = useCallback(() => {
    sessionIdentity.current += 1;
    uploadController.current?.abort();
    uploadController.current = null;
    releaseObjectUrl();
    setSession({ kind: "empty" });
    setSelectionError(null);
    setJobMessage(null);
  }, [releaseObjectUrl]);

  const updateDuration = useCallback((mediaUrl: string, seconds: number) => {
    if (ownedObjectUrl.current !== mediaUrl) return;
    setSession((current) => current.kind !== "empty" && current.url === mediaUrl
      ? { ...current, durationSeconds: seconds }
      : current);
    if (seconds > MAX_FILE_DURATION_SECONDS) {
      setSelectionError((currentError) => ownedObjectUrl.current === mediaUrl
        ? "ไฟล์ยาวเกิน 2 ชั่วโมง กรุณาเลือกไฟล์ที่สั้นกว่านี้"
        : currentError);
    }
  }, []);

  const startTranscription = useCallback(async () => {
    if (session.kind !== "selected" || uploadController.current) return;
    const identity = sessionIdentity.current;
    if (serviceState !== "ready") {
      if (isCurrentSession(identity)) setJobMessage("STT service ยังไม่พร้อม ตรวจสอบว่า service ทำงานอยู่บนเครื่องนี้แล้วลองอีกครั้ง");
      return;
    }
    if (session.file.size > MAX_FILE_BYTES) {
      setSelectionError("ไฟล์มีขนาดเกิน 1 GiB กรุณาเลือกไฟล์ที่เล็กกว่านี้");
      return;
    }
    if (session.durationSeconds !== null && session.durationSeconds > MAX_FILE_DURATION_SECONDS) {
      setSelectionError("ไฟล์ยาวเกิน 2 ชั่วโมง กรุณาเลือกไฟล์ที่สั้นกว่านี้");
      return;
    }

    const original = session;
    const controller = new AbortController();
    uploadController.current = controller;
    setJobMessage(null);
    setSession((current) => isCurrentSession(identity) && current.kind === "selected" && current.url === original.url
      ? { ...original, kind: "submitting", uploadPercent: 0 }
      : current);
    try {
      const jobId = await submitFile(original.file, (uploadPercent) => {
        setSession((current) => isCurrentSession(identity) && current.kind === "submitting" && current.url === original.url
          ? { ...current, uploadPercent }
          : current);
      }, controller.signal);
      setSession((current) => isCurrentSession(identity) && current.kind === "submitting" && current.url === original.url
        ? { ...current, kind: "queued", jobId, progressPercent: 0 }
        : current);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (isCurrentSession(identity)) {
        setJobMessage(error instanceof Error ? error.message : "ส่งไฟล์ไม่สำเร็จ กรุณาลองใหม่");
        setSession((current) => isCurrentSession(identity) && current.kind === "submitting" && current.url === original.url
          ? { ...original, kind: "selected" }
          : current);
        if (error instanceof Error && error.message.includes("service")) setServiceState("unavailable");
      }
    } finally {
      if (uploadController.current === controller) uploadController.current = null;
    }
  }, [isCurrentSession, serviceState, session]);

  const media: MediaFile | null = session.kind === "empty" ? null : session;

  return {
    session,
    media,
    serviceState,
    selectionError,
    setSelectionError,
    jobMessage,
    checkService,
    selectFile,
    clearSession,
    updateDuration,
    startTranscription,
  };
}
