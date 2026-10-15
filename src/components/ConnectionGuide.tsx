import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectionGuide({ expanded = false }: { expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  return (
    <section className="mt-3">
      <Button variant="ghost" className="h-10 w-full justify-center gap-2 text-sm text-muted-foreground" aria-expanded={open} onClick={() => setOpen(!open)}>
        Как подключиться?
        <ChevronDown className={open ? "rotate-180" : ""} />
      </Button>
      {open && <>
        <ol className="mt-3 space-y-4 border-l-2 border-primary/20 pl-4">
          {[
            ["Оплатите доступ", "Выберите тариф и завершите оплату."],
            ["Подтвердите в Telegram", "Когда появится окно, нажмите «Подключить»."],
            ["Готово", "Возвращайтесь к переписке и наслаждайтесь общением."],
          ].map(([title, detail], index) => <li key={title} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-primary">{index + 1}</span>
            <div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>
          </li>)}
        </ol>
        <p className="mt-4 text-center text-xs text-muted-foreground">В тестовом режиме подключение не выполняется.</p>
      </>}
    </section>
  );
}