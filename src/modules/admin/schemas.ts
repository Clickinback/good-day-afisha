import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.string().url("Некорректная ссылка")]);

export const eventFormSchema = z.object({
  title:z.string().trim().min(3,"Введите название"),
  slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: латиница, цифры и дефисы"),
  shortDescription:z.string().trim().max(280).optional(),
  description:z.string().trim().optional(),
  imageUrl:optionalUrl,
  cityId:z.string().min(1), categoryId:z.string().min(1), venueId:z.string().optional(), organizerId:z.string().optional(),
  address:z.string().trim().optional(), startsAt:z.coerce.date(), timeTbd:z.coerce.boolean().default(false), endsAt:z.union([z.literal(""),z.coerce.date()]).optional(),
  priceMin:z.union([z.literal(""),z.coerce.number().nonnegative()]).optional(), priceMax:z.union([z.literal(""),z.coerce.number().nonnegative()]).optional(),
  isFree:z.coerce.boolean().default(false), ageRestriction:z.string().trim().optional(), ticketUrl:optionalUrl,
  status:z.enum(["DRAFT","PENDING","PUBLISHED","REJECTED","FINISHED","CANCELLED"]),
});

export type EventFormState={ok:boolean;message?:string;errors?:Record<string,string[]>};

const collectorSettingsSchema=z.object({
  maxItems:z.number().int().min(1).max(100).optional(),
  delayMs:z.number().int().min(0).max(5000).optional(),
  respectRobots:z.boolean().optional(), syncScreenings:z.boolean().optional(), includeForwarded:z.boolean().optional(),
  itemSelector:z.string().max(1000).optional(), linkSelector:z.string().max(1000).optional(),
  titleSelector:z.string().max(1000).optional(), descriptionSelector:z.string().max(1000).optional(),
  imageSelector:z.string().max(1000).optional(), dateSelector:z.string().max(1000).optional(),
}).passthrough();

export const sourceFormSchema=z.object({
  name:z.string().trim().min(2,"Введите название"),
  type:z.enum(["WEBSITE","TELEGRAM","RSS","API","SOCIAL","MANUAL"]),
  url:z.string().max(2048).url("Введите полную ссылку").refine(value=>{try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password}catch{return false}},"Нужна HTTP(S)-ссылка без логина и пароля"),
  cityId:z.string().optional(),
  trustScore:z.coerce.number().min(0).max(1),
  collectionMethod:z.enum(["HTML","RSS","API","TELEGRAM","MANUAL"]),
  active:z.coerce.boolean().default(false),
  config:z.string().trim().max(20_000).optional().transform((value,ctx)=>{if(!value)return {};try{const parsed:unknown=JSON.parse(value);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();return parsed as Record<string,unknown>}catch{ctx.addIssue({code:"custom",message:"Конфигурация должна быть JSON-объектом, например {}"});return z.NEVER}}).pipe(collectorSettingsSchema),
});
export type AdminFormState={ok:boolean;message?:string;errors?:Record<string,string[]>};
