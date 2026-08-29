import type { Source } from "@prisma/client";

export type CollectedItem={externalId?:string;url:string;rawText:string;rawHtml?:string;imageUrl?:string;publishedAt?:Date};
export type FetchPageResult={url:string;html:string;contentType:string};
export type CollectorContext={fetchPage:(url:string)=>Promise<FetchPageResult>;log:(message:string,details?:Record<string,unknown>)=>void};
export interface Collector { readonly kind:string; supports(source:Source):boolean; collect(source:Source,context:CollectorContext):Promise<CollectedItem[]> }
export type WebsiteConfig={itemSelector?:string;linkSelector?:string;titleSelector?:string;descriptionSelector?:string;imageSelector?:string;dateSelector?:string;maxItems?:number;delayMs?:number;respectRobots?:boolean;syncScreenings?:boolean};
export type TelegramConfig={maxItems?:number;includeForwarded?:boolean};
