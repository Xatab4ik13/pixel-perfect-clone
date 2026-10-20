import plane from '@/assets/icon-key.webp';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/DemoProvider';

/** Shown when the app is opened outside Telegram (e.g. a desktop browser). */
export function TelegramGate() {
  const { botUsername } = useDemo();
  const botUrl = botUsername ? `https://t.me/${botUsername}` : null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-sky px-6">
      <div className="max-w-sm text-center">
        <img src={plane} alt="" width={256} height={256} className="mx-auto h-20 w-20 object-contain" />
        <h1 className="mt-4 text-3xl font-extrabold">Лазейка</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Приложение работает внутри Telegram. Откройте нашего бота и нажмите «Открыть».
        </p>
        {botUrl ? (
          <Button asChild className="mt-6 h-12 w-full rounded-2xl bg-gradient-primary shadow-button">
            <a href={botUrl}>Открыть в Telegram</a>
          </Button>
        ) : (
          <p className="mt-6 text-xs text-muted-foreground">Найдите нашего бота в Telegram и запустите его.</p>
        )}
      </div>
    </div>
  );
}
