import { IconImg } from '@/components/AppShell';
import shield from '@/assets/benefit-shield.png';
import backdrop from '@/assets/benefits-backdrop.jpg';
import plane from '@/assets/icon-key.png';
import bolt from '@/assets/icon-bolt.png';

export function HomeBenefits() {
  return <section aria-label="Преимущества Лазейки" className="relative -mx-5 mt-9 isolate overflow-hidden px-5 pb-8 pt-7">
    <img src={backdrop} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
    <div className="absolute inset-0 -z-10 bg-background/30" />
    <h2 className="mb-6 text-xl font-extrabold">Без лишних сложностей</h2>
    <div className="space-y-5">
      <article className="relative mr-3 min-h-36 rounded-2xl border border-card/70 bg-card/90 p-5 pr-28 shadow-soft backdrop-blur-sm">
        <h3 className="text-base font-extrabold">Стабильное<br />соединение</h3><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Ваш персональный сервер.<br />Без отдельных приложений.</p>
        <img src={plane} alt="" loading="lazy" width={256} height={256} className="benefit-cutout absolute -right-4 -top-4 h-36 w-36 rotate-[-8deg] object-contain" />
      </article>
      <article className="relative ml-3 min-h-40 rounded-2xl border border-card/70 bg-card/90 p-5 pl-32 shadow-soft backdrop-blur-sm">
        <img src={shield} alt="" loading="lazy" width={816} height={816} className="benefit-cutout absolute -left-6 -top-3 h-40 w-40 object-contain" />
        <h3 className="text-base font-extrabold">Всегда<br />на связи</h3><p className="mt-3 text-xs leading-relaxed text-muted-foreground">С близкими, работой<br />и любимыми каналами.</p>
      </article>
    </div>
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-2 text-xs font-bold shadow-soft"><IconImg src={bolt} className="h-5 w-5" />Быстро</span>
      <span className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-2 text-xs font-bold shadow-soft"><IconImg src={shield} className="h-5 w-5" />Надёжно</span>
      <span className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-2 text-xs font-bold shadow-soft"><IconImg src={plane} className="h-5 w-5" />В одно нажатие</span>
    </div>
  </section>;
}