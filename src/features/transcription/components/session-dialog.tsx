"use client";

import { useEffect, useRef, type ReactNode, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  cancelLabel: string;
  onCancel: () => void;
  body?: ReactNode;
  children: ReactNode;
};

export function SessionDialog({ title, description, cancelLabel, onCancel, body, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const restoreFocusOnCloseRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const initialFocus = dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]") ?? dialog.querySelector<HTMLElement>("button");
    initialFocus?.focus();

    return () => {
      if (dialog.open) dialog.close();
      if (restoreFocusOnCloseRef.current && returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, []);

  function cancel(event?: SyntheticEvent<HTMLDialogElement>) {
    event?.preventDefault();
    restoreFocusOnCloseRef.current = true;
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-[0_18px_56px_rgb(15_35_60_/_24%)] backdrop:bg-ink/40"
      aria-labelledby="session-dialog-title"
      aria-describedby="session-dialog-description"
      onCancel={cancel}
    >
      <div className="p-5 sm:p-6">
        <h2 id="session-dialog-title" className="m-0 text-lg font-semibold text-ink sm:text-xl">{title}</h2>
        <p id="session-dialog-description" className="m-0 mt-2 break-words text-sm leading-relaxed text-ink-muted">{description}</p>
        {body ? <div className="mt-5 min-w-0">{body}</div> : null}
        <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row">
          <Button variant="secondary" type="button" onClick={() => cancel()}>{cancelLabel}</Button>
          {children}
        </div>
      </div>
    </dialog>
  );
}
