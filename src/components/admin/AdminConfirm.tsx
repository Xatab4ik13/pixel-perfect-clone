import { useState } from "react";

export type PendingAction = { title: string; onDone?: (() => void) | undefined } | null;

// Every mutating admin action goes through this dialog: confirmation + required reason.
export function AdminConfirm({ action, onClose, onLog }: { action: PendingAction; onClose: () => void; onLog: (text: string) => void }) {
  const [reason, setReason] = useState("");
  if (!action) return null;
  const close = () => { setReason(""); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-bold">Подтвердите действие</h3>
        <p className="mt-1 text-sm text-muted-foreground">{action.title}</p>
        <label className="mt-4 block text-sm font-semibold">Причина
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm font-normal" placeholder="Обязательно укажите причину" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={close} className="rounded-lg border border-border px-4 py-2 text-sm">Отмена</button>
          <button disabled={!reason.trim()} onClick={() => { onLog(`${action.title} — причина: ${reason.trim()}`); action.onDone?.(); close(); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">Подтвердить</button>
        </div>
      </div>
    </div>
  );
}
