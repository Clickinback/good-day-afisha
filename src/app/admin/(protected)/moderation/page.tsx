import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Check, Edit3, ExternalLink, FileText, Inbox, X } from "lucide-react";
import { updateEventStatus } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { moderationInsights } from "@/modules/moderation/insights";

type ModerationEvent = Prisma.EventGetPayload<{
  include: { city: true; category: true; venue: true; organizer: true; sources: { include: { source: true; rawEvent: true } } };
}>;

export default async function ModerationPage() {
  let items: ModerationEvent[] = [];
  try {
    items = await prisma.event.findMany({
      where: { moderationStatus: "PENDING" },
      include: { city: true, category: true, venue: true, organizer: true, sources: { include: { source: true, rawEvent: true } } },
      orderBy: { createdAt: "asc" },
    });
  } catch {}

  return (
    <>
      <header className="admin-top">
        <div>
          <span className="eyebrow coral">Контроль качества</span>
          <h1>Требует проверки</h1>
          <p>{items.length ? items.length + " событий ждут решения" : "Все найденные события обработаны"}.</p>
        </div>
      </header>

      {items.length ? <div className="moderation-list">
        {items.map((event) => {
          const insight = moderationInsights(event);
          const primary = event.sources.find((source) => source.isPrimary) ?? event.sources[0];
          const rawText = primary?.rawEvent?.rawText?.trim();
          return <article className="admin-card moderation-review" key={event.id}>
            <section className="moderation-preview">
              <div className="moderation-scores">
                <span>AI <b>{insight.ai}%</b></span>
                <span>Publish <b>{insight.publish}%</b></span>
              </div>
              <h2>{event.title}</h2>
              <p>{event.shortDescription ?? event.description ?? "Описание отсутствует"}</p>
              <dl>
                <div><dt>Дата</dt><dd>{event.startsAt.toLocaleString("ru-BY", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</dd></div>
                <div><dt>Город</dt><dd>{event.city.name}</dd></div>
                <div><dt>Категория</dt><dd>{event.category.name}</dd></div>
                <div><dt>Место</dt><dd>{event.venue?.name ?? event.address ?? "Не определено"}</dd></div>
              </dl>
              <div className="moderation-reason">
                <b>Почему нужна проверка</b>
                <p>{insight.reasons.join(" · ") || "Решение запрошено источником или администратором"}</p>
              </div>
              {insight.missing.length > 0 && <div className="missing-fields">
                <b>Не заполнено:</b>{insight.missing.map((field) => <span key={field}>{field}</span>)}
              </div>}
            </section>

            <aside className="moderation-source">
              <header><FileText size={17} /><b>Исходная публикация</b></header>
              {primary ? <>
                <div className="source-identity">
                  <span>{primary.source.name}</span>
                  <small>Trust {Number(primary.source.trustScore).toFixed(2)}</small>
                </div>
                <p>{rawText ? rawText.slice(0, 900) : "Исходный текст недоступен."}</p>
                <div className="source-links">
                  {primary.rawEventId && <Link href={"/admin/raw-events/" + primary.rawEventId}>Полный результат AI</Link>}
                  <a href={primary.sourceUrl} target="_blank" rel="noreferrer">Открыть источник <ExternalLink size={12} /></a>
                </div>
              </> : <p>Связанный источник не найден.</p>}
            </aside>

            <footer className="moderation-actions">
              <form action={updateEventStatus}>
                <input type="hidden" name="id" value={event.id} />
                <button name="status" value="PUBLISHED"><Check />Опубликовать</button>
                <button name="status" value="REJECTED"><X />Отклонить</button>
              </form>
              <Link className="moderation-edit" href={"/admin/events/" + event.id + "/edit"}><Edit3 size={14} />Редактировать</Link>
            </footer>
          </article>;
        })}
      </div> : <section className="admin-card admin-empty moderation-clear">
        <Inbox />
        <h2>Всё проверено</h2>
        <p>Новых событий, требующих решения администратора, сейчас нет. Они появятся здесь после следующего автоматического сбора.</p>
        <Link href="/admin/automation">Перейти к автоматизации</Link>
      </section>}
    </>
  );
}

