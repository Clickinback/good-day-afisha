import * as cheerio from "cheerio";
import type { Source } from "@prisma/client";
import { collectorConfig } from "./config";
import type { CollectedItem,Collector,CollectorContext,TelegramConfig } from "./types";

export function extractTelegramPosts(html:string,pageUrl:string,config:TelegramConfig={}):CollectedItem[]{
  const $=cheerio.load(html);const items:CollectedItem[]=[];
  $(".tgme_widget_message_wrap").each((_,node)=>{const message=$(node).find(".tgme_widget_message").first();const externalId=message.attr("data-post");const body=message.find(".tgme_widget_message_text").first().text().replace(/\u00a0/g," ").trim();if(!externalId||!body)return;const forwarded=message.find(".tgme_widget_message_forwarded_from").length>0;if(forwarded&&!config.includeForwarded)return;const dateValue=message.find("time").attr("datetime");const photoStyle=message.find(".tgme_widget_message_photo_wrap").attr("style")??"";const imageMatch=photoStyle.match(/url\(['\"]?([^'\")]+)['\"]?\)/);items.push({externalId,url:`https://t.me/${externalId}`,rawText:body,rawHtml:$.html(node),imageUrl:imageMatch?.[1],publishedAt:dateValue?new Date(dateValue):undefined})});
  const limit=Math.min(config.maxItems??collectorConfig.maxItemsPerRun,collectorConfig.maxItemsPerRun);return items.slice(-limit);
}

export class TelegramCollector implements Collector{readonly kind="telegram";supports(source:Source){return source.type==="TELEGRAM"&&source.collectionMethod==="TELEGRAM"}async collect(source:Source,context:CollectorContext){const page=await context.fetchPage(source.url);const items=extractTelegramPosts(page.html,page.url,(source.config??{}) as TelegramConfig);if(!items.length)throw new Error("Публичная страница Telegram не содержит доступных сообщений");context.log("Telegram posts extracted",{count:items.length});return items}}
