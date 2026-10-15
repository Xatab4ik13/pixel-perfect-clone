import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectionGuide({ expanded = false }: { expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  return (
    <section className="mt-3 border-b border-border pb-4">
      <Button variant="ghost" className="h-auto w-full justify-between px-1 py-2 text-sm font-semibold" aria-expanded={open} onClick={() => setOpen(!open)}>
        Как подключиться?
        <ChevronDown className={open ? "rotate-180" : ""} />
      </Button>
      {open && <>
        <ol className="mt-2 space-y-3 px-1">
          {[
            ["Откройте Лазейку в Telegram", "Используйте официальный Telegram на телефоне или компьютере."],
            ["Подтвердите подключение прокси", "Когда появится окно Telegram, нажмите «Подключить прокси»."],
            ["Вернитесь к переписке", "После подключения отправьте сообщение в «Избранное»."],
          ].map(([title, detail], index) => <li key={title} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-primary">{index + 1}</span>
            <div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>
          </li>)}
        </ol>
        <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">Сейчас доступна только инструкция. Подключение прокси ещё не настроено.</p>
      </>}
    </section>
  );
}