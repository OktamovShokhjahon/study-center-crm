import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import uz from "../../messages/uz.json";
import { routing } from "./routing";

const messagesByLocale = { en, ru, uz } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "uz" | "en" | "ru")) {
    locale = routing.defaultLocale;
  }
  const key = locale as keyof typeof messagesByLocale;
  return {
    locale,
    messages: messagesByLocale[key],
  };
});
