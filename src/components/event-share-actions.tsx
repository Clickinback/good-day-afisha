"use client";

import { Check, Copy, Send, Share2 } from "lucide-react";
import { useState } from "react";
import { buildTelegramShareUrl, buildVkShareUrl } from "@/lib/event-sharing";

type ShareChannel = "native" | "telegram" | "vk" | "copy";
type ZarazWindow = Window & { zaraz?: { track: (event: string, properties?: Record<string, string>) => Promise<void> } };

function trackShare(channel: ShareChannel, eventSlug: string, city: string) {
  const zaraz = (window as ZarazWindow).zaraz;
  if (!zaraz) return;
  void zaraz.track("event_share", { channel, event_slug: eventSlug, city }).catch(() => undefined);
}

async function copyLink(url: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(url);
  const field = document.createElement("textarea");
  field.value = url;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copy failed");
}

export function EventShareActions({ title, text, url, eventSlug, city }: { title: string; text: string; url: string; eventSlug: string; city: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        trackShare("native", eventSlug, city);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        await handleCopy("native");
      }
      return;
    }
    await handleCopy("native");
  }

  async function handleCopy(channel: "copy" | "native" = "copy") {
    try {
      await copyLink(url);
      setCopyState("copied");
      trackShare(channel, eventSlug, city);
    } catch {
      setCopyState("error");
    }
  }

  return <section className="event-share" aria-labelledby="event-share-title">
    <div><b id="event-share-title">Поделиться событием</b><small>Отправьте друзьям — пусть хороший день случится вместе.</small></div>
    <div className="share-buttons">
      <button className="share-primary" type="button" onClick={handleNativeShare}><Share2 size={17}/>Поделиться</button>
      <a href={buildTelegramShareUrl(url, text)} target="_blank" rel="noreferrer" onClick={() => trackShare("telegram", eventSlug, city)}><Send size={16}/>Telegram</a>
      <a href={buildVkShareUrl(url, text)} target="_blank" rel="noreferrer" onClick={() => trackShare("vk", eventSlug, city)}><span aria-hidden="true">VK</span><span className="sr-only">ВКонтакте</span></a>
      <button type="button" aria-live="polite" onClick={() => handleCopy()}>{copyState === "copied" ? <Check size={16}/> : <Copy size={16}/>} {copyState === "copied" ? "Скопировано" : copyState === "error" ? "Не скопировано" : "Ссылка"}</button>
    </div>
  </section>;
}
