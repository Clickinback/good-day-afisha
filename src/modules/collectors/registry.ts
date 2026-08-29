import type { Source } from "@prisma/client";
import type { Collector } from "./types";
import { WebsiteCollector } from "./website";
import { TelegramCollector } from "./telegram";
const collectors:Collector[]=[new WebsiteCollector(),new TelegramCollector()];
export function collectorFor(source:Source){const collector=collectors.find(item=>item.supports(source));if(!collector)throw new Error(`Collector не зарегистрирован для ${source.type}/${source.collectionMethod}`);return collector}
