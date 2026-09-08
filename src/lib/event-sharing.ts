type ShareDetails = {
  title: string;
  date: string;
  time?: string;
  venue: string;
  city: string;
};

export function buildEventShareText({ title, date, time, venue, city }: ShareDetails) {
  return [`🎟 ${title}`, `📅 ${date}${time ? ` · ${time}` : ""}`, `📍 ${venue}, ${city}`, "", "Good Day Афиша"].join("\n");
}

export function buildTelegramShareUrl(eventUrl: string, text: string) {
  const params = new URLSearchParams({ url: eventUrl, text });
  return `https://t.me/share/url?${params}`;
}

export function buildVkShareUrl(eventUrl: string, text: string) {
  const params = new URLSearchParams({ url: eventUrl, title: text });
  return `https://vk.com/share.php?${params}`;
}
