export const shareChannels = ["native", "telegram", "vk", "copy"] as const;
export type ShareChannelInput = typeof shareChannels[number];

export const shareChannelLabels: Record<ShareChannelInput, string> = {
  native: "Системное меню",
  telegram: "Telegram",
  vk: "ВКонтакте",
  copy: "Копирование",
};

const minskDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Minsk",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function shareMetricDay(date = new Date()) {
  const parts = Object.fromEntries(
    minskDayFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

export function hasSameHostOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
