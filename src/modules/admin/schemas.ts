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

export const sourceFormSchema=z.object({
  name:z.string().trim().min(2,"Введите название"),
  type:z.enum(["WEBSITE","TELEGRAM","RSS","API","SOCIAL","MANUAL"]),
  url:z.string().url("Введите полную ссылку"),
  cityId:z.string().optional(),
  trustScore:z.coerce.number().min(0).max(1),
  collectionMethod:z.enum(["HTML","RSS","API","TELEGRAM","MANUAL"]),
  active:z.coerce.boolean().default(false),
  config:z.string().trim().optional().transform((value,ctx)=>{if(!value)return undefined;try{return JSON.parse(value) as unknown}catch{ctx.addIssue({code:"custom",message:"Некорректный JSON"});return z.NEVER}}),
});
export type AdminFormState={ok:boolean;message?:string;errors?:Record<string,string[]>};
