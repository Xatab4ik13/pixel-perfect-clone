import sbp from "@/assets/icon-sbp.svg";

/**
 * Цветной знак СБП (Система быстрых платежей) для больших кнопок оплаты.
 * Высота совпадает с иконкой стрелки в кнопке (16px), знак приподнят на 1px,
 * чтобы его центр совпадал с центром заглавных букв текста.
 */
export function SbpMark({ className = "h-4" }: { className?: string }) {
  return (
    <img
      src={sbp}
      alt="СБП"
      width={97}
      height={120}
      loading="lazy"
      className={`${className} w-auto shrink-0 -translate-y-px object-contain`}
    />
  );
}
