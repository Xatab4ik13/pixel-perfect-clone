/** Preview exposes local UI only; production still requires Telegram entry. */
export function canShowApp(isTelegram: boolean, isDevelopment: boolean): boolean {
  return isTelegram || isDevelopment;
}