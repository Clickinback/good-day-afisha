import { Activity, AlertTriangle, Bot, CheckCircle2, Clock3, Database, Radio, XCircle } from "lucide-react";
import { runAutomationNow } from "@/app/admin/automation-actions";
import { AutomationRunButton } from "@/components/admin/automation-run-button";
import { prisma } from "@/lib/prisma";
import { estimateOpenAiCost, formatEstimatedUsd, formatTokenCount, openAiPricingFromEnv, openAiUsageWindows, type TokenUsage } from "@/lib/openai-usage";

type Step = {
  name: string;
  status: "SUCCEEDED" | "WARNING" | "SKIPPED" | "FAILED";
  durationMs: number;
  summary?: Record<string, unknown>;
  error?: string;
};
type Run = {
  id: string;
  status: string;
  trigger: string;
  startedAt: Date;
  finishedAt: Date | null;
  steps: unknown;
  errorMessage: string | null;
  serverNow: Date;
};

const stepNames: Record<string, string> = {
  collectSources: "Сбор источников",
  processRawEvents: "AI-разбор",
  detectDuplicates: "Поиск дублей",
  publishEvents: "Автопубликация",
  updateExpiredEvents: "Жизненный цикл",
  generateCollections: "Подборки",
};
const summaryNames: Record<string, string> = {
  sources: "источников", failed: "ошибок", found: "найдено", created: "создано",
  processed: "обработано", MATCHED: "совпадений", MODERATION: "на проверку",
  CREATED: "новых", SKIPPED: "пропущено", evaluated: "оценено",
  published: "опубликовано", moderation: "на модерации", finished: "завершено",
  checked: "проверено", applied: "применено", review: "требует проверки", skipped: "пропущено",
  collections: "подборок", events: "событий",
};
function parseSteps(value: unknown): Step[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Step => Boolean(item && typeof item === "object" && "name" in item && "status" in item));
}
function numberFrom(step: Step | undefined, key: string) {
  const value = step?.summary?.[key];
  return typeof value === "number" ? value : 0;
}
function icon(status: string) {
  if (status === "SUCCEEDED") return <CheckCircle2 />;
  if (status === "RUNNING") return <Clock3 />;
  if (status === "WARNING" || status === "PARTIAL") return <AlertTriangle />;
  if (status === "SKIPPED") return <Activity />;
  return <XCircle />;
}

export default async function AutomationPage() {
  let runs: Run[] = [];
  let dbConnected = true;
  let activeSources = 0;
  const usageWindows = openAiUsageWindows();
  let tokenUsage: Record<"today" | "sevenDays" | "thirtyDays", TokenUsage> = {
    today: { input: 0, output: 0 },
    sevenDays: { input: 0, output: 0 },
    thirtyDays: { input: 0, output: 0 },
  };
  try {
    const [recentRuns, sourceCount, today, sevenDays, thirtyDays] = await Promise.all([
      prisma.$queryRawUnsafe<Run[]>('SELECT "id", "status", "trigger", "startedAt", "finishedAt", "steps", "errorMessage", NOW() AS "serverNow" FROM "AutomationRun" ORDER BY "startedAt" DESC LIMIT 30'),
      prisma.source.count({ where: { active: true } }),
      prisma.rawEvent.aggregate({ where: { processedAt: { gte: usageWindows.today } }, _sum: { inputTokens: true, outputTokens: true } }),
      prisma.rawEvent.aggregate({ where: { processedAt: { gte: usageWindows.sevenDays } }, _sum: { inputTokens: true, outputTokens: true } }),
      prisma.rawEvent.aggregate({ where: { processedAt: { gte: usageWindows.thirtyDays } }, _sum: { inputTokens: true, outputTokens: true } }),
    ]);
    runs = recentRuns;
    activeSources = sourceCount;
    tokenUsage = {
      today: { input: today._sum.inputTokens ?? 0, output: today._sum.outputTokens ?? 0 },
      sevenDays: { input: sevenDays._sum.inputTokens ?? 0, output: sevenDays._sum.outputTokens ?? 0 },
      thirtyDays: { input: thirtyDays._sum.inputTokens ?? 0, output: thirtyDays._sum.outputTokens ?? 0 },
    };
  } catch {
    dbConnected = false;
  }

  const last = runs[0];
  const lastSteps = parseSteps(last?.steps);
  const collect = lastSteps.find((step) => step.name === "collectSources");
  const parser = lastSteps.find((step) => step.name === "processRawEvents");
  const publication = lastSteps.find((step) => step.name === "publishEvents");
  const collections = lastSteps.find((step) => step.name === "generateCollections");
  const configuredIntervalSeconds = Number(process.env.PIPELINE_INTERVAL_SECONDS ?? 3600);
  const intervalMinutes = Number.isFinite(configuredIntervalSeconds) && configuredIntervalSeconds > 0
    ? Math.max(1, Math.round(configuredIntervalSeconds / 60))
    : 60;
  const nextExpected = last ? new Date(last.startedAt.getTime() + intervalMinutes * 60_000) : null;
  const stale = !last || last.serverNow.getTime() - last.startedAt.getTime() > intervalMinutes * 2.5 * 60_000;
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_EVENT_PARSER_MODEL);
  const pricing = openAiPricingFromEnv();
  const usagePeriods = [
    { key: "today" as const, label: "Сегодня" },
    { key: "sevenDays" as const, label: "7 дней" },
    { key: "thirtyDays" as const, label: "30 дней" },
  ];
  const warnings = [
    !dbConnected ? "PostgreSQL недоступен. Проверьте Docker Desktop и DATABASE_URL." : null,
    dbConnected && activeSources === 0 ? "Нет активных источников для автоматического сбора." : null,
    !aiConfigured ? "AI-разбор отключён: не настроены OPENAI_API_KEY или OPENAI_EVENT_PARSER_MODEL." : null,
    dbConnected && stale ? "Автоматизация давно не запускалась. Проверьте планировщик Windows." : null,
    last?.status === "FAILED" || last?.status === "PARTIAL" ? "Последний запуск завершился с ошибками или предупреждениями." : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <>
      <header className="admin-top">
        <div>
          <span className="eyebrow coral">Operations</span>
          <h1>Автоматизация</h1>
          <p>Полный цикл обновления афиши и состояние фоновых процессов.</p>
        </div>
        <form action={runAutomationNow}><AutomationRunButton disabled={!dbConnected} /></form>
      </header>

      {warnings.map((warning) => <div className="admin-notice" key={warning}><AlertTriangle /><div><b>Требует внимания</b><p>{warning}</p></div></div>)}

      <div className="automation-health">
        <div className="admin-card">
          <i className={dbConnected ? "ok" : "fail"}><Database /></i>
          <span>PostgreSQL</span><b>{dbConnected ? "Работает" : "Недоступен"}</b>
        </div>
        <div className="admin-card">
          <i className={activeSources ? "ok" : "fail"}><Radio /></i>
          <span>Источники</span><b>{activeSources} активных</b>
        </div>
        <div className="admin-card">
          <i className={aiConfigured ? "ok" : "warn"}><Bot /></i>
          <span>AI parser</span><b>{aiConfigured ? "Настроен" : "Отключён"}</b>
        </div>
        <div className="admin-card">
          <i className={!stale ? "ok" : "warn"}><Clock3 /></i>
          <span>Следующий контроль</span><b>{nextExpected ? nextExpected.toLocaleString("ru-BY") : "После запуска"}</b>
        </div>
      </div>

      {last && <section className="automation-summary">
        <div><span>Найдено</span><b>{numberFrom(collect, "found")}</b></div>
        <div><span>Обработано AI</span><b>{numberFrom(parser, "processed")}</b></div>
        <div><span>Опубликовано</span><b>{numberFrom(publication, "published")}</b></div>
        <div><span>Событий в подборках</span><b>{numberFrom(collections, "events")}</b></div>
      </section>}

      <section className="admin-card ai-usage">
        <header>
          <div><span className="eyebrow coral">OpenAI usage</span><h2>Расход токенов</h2></div>
          <p>Модель: <b>{process.env.OPENAI_EVENT_PARSER_MODEL || "не настроена"}</b></p>
        </header>
        <div className="ai-usage-grid">
          {usagePeriods.map(({ key, label }) => {
            const usage = tokenUsage[key];
            const total = usage.input + usage.output;
            return <div key={key}>
              <span>{label}</span>
              <b>{formatTokenCount(total)}</b>
              <small>вход: {formatTokenCount(usage.input)} · выход: {formatTokenCount(usage.output)}</small>
              <strong>{formatEstimatedUsd(estimateOpenAiCost(usage, pricing))}</strong>
            </div>;
          })}
        </div>
        <footer>{pricing
          ? "Стоимость приблизительная и рассчитана по тарифам, заданным для текущей модели."
          : "Для оценки стоимости задайте тарифы текущей модели за 1 млн входных и выходных токенов. Фактические токены уже учитываются."}</footer>
      </section>

      <section className="automation-runs">
        <div className="table-toolbar"><b>Последние запуски</b><span>каждые {intervalMinutes} минут</span></div>
        {runs.map((run) => {
          const steps = parseSteps(run.steps);
          return <article className="admin-card automation-run" key={run.id}>
            <header>
              <i className={"run-state " + run.status.toLowerCase()}>{icon(run.status)}</i>
              <div><b>{run.status}</b><span>{run.startedAt.toLocaleString("ru-BY")} · {run.trigger}</span></div>
              <strong>{run.finishedAt ? Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000) + " сек." : "выполняется"}</strong>
            </header>
            <div className="automation-steps">
              {steps.map((step) => <div className={"automation-step " + step.status.toLowerCase()} key={step.name}>
                <i>{icon(step.status)}</i>
                <b>{stepNames[step.name] ?? step.name}</b>
                <small>{Math.max(step.durationMs, 0)} мс</small>
                {step.summary && <p>{Object.entries(step.summary).map(([key, value]) => summaryNames[key] + ": " + String(value)).join(" · ")}</p>}
                {step.error && <p className="step-error">{step.error}</p>}
              </div>)}
            </div>
            {run.errorMessage && <p className="automation-error">{run.errorMessage}</p>}
          </article>;
        })}
        {!runs.length && <section className="admin-card admin-empty"><Activity /><h2>Запусков пока нет</h2><p>Нажмите «Запустить сейчас», чтобы выполнить полный цикл.</p></section>}
      </section>
    </>
  );
}
