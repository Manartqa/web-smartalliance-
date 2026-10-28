"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ModalDialogProps {
  open: boolean;
  /** Called when the visitor presses Esc. */
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/**
 * A native modal `<dialog>`: the browser traps focus inside it and makes the
 * page behind it inert. `open` drives `showModal()` and `close()`; the `open`
 * attribute is never set directly, which would show the dialog without any of
 * that.
 *
 * Esc is handled through `cancel`, not `close`: `close` also fires after our
 * own `close()` call, so a parent that had already moved on (notice accepted,
 * chat opening) would be told to close everything.
 */
export default function ModalDialog({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: ModalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn("m-auto p-0 backdrop:bg-navy-deep/70", className)}
    >
      {open && children}
    </dialog>
  );
}
