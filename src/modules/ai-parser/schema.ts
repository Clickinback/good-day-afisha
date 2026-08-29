import { z } from "zod";

const nullableString=z.string().nullable();
export const parsedEventSchema=z.object({
  isEvent:z.boolean(),title:nullableString,description:nullableString,city:nullableString,venue:nullableString,address:nullableString,
  startDate:nullableString,startTime:nullableString,timeTbd:z.boolean().default(false),endDate:nullableString,endTime:nullableString,
  category:z.enum(["concerts","theatre","cinema","parties","festivals","exhibitions","kids","sport","free","other"]).nullable(),
  announcementStatus:z.enum(["scheduled","cancelled","postponed","rescheduled"]).nullable().default(null),
  priceMin:z.number().nonnegative().nullable(),priceMax:z.number().nonnegative().nullable(),isFree:z.boolean().nullable(),
  ageRestriction:nullableString,organizer:nullableString,ticketUrl:nullableString,confidence:z.number().min(0).max(1),
  warnings:z.array(z.string()),evidence:z.array(z.object({field:z.string(),quote:z.string()})),
}).strict();
export type ParsedEvent=z.infer<typeof parsedEventSchema>;

const nullable=(type:string,extra:Record<string,unknown>={})=>({anyOf:[{type},{type:"null"}],...extra});
export const parsedEventJsonSchema={type:"object",additionalProperties:false,required:["isEvent","title","description","city","venue","address","startDate","startTime","timeTbd","endDate","endTime","category","announcementStatus","priceMin","priceMax","isFree","ageRestriction","organizer","ticketUrl","confidence","warnings","evidence"],properties:{
  isEvent:{type:"boolean"},title:nullable("string"),description:nullable("string"),city:nullable("string"),venue:nullable("string"),address:nullable("string"),
  startDate:nullable("string",{description:"YYYY-MM-DD or null"}),startTime:nullable("string",{description:"HH:mm or null"}),timeTbd:{type:"boolean"},endDate:nullable("string",{description:"YYYY-MM-DD or null"}),endTime:nullable("string",{description:"HH:mm or null"}),
  category:{anyOf:[{type:"string",enum:["concerts","theatre","cinema","parties","festivals","exhibitions","kids","sport","free","other"]},{type:"null"}]},
  announcementStatus:{anyOf:[{type:"string",enum:["scheduled","cancelled","postponed","rescheduled"]},{type:"null"}]},
  priceMin:nullable("number",{minimum:0}),priceMax:nullable("number",{minimum:0}),isFree:nullable("boolean"),ageRestriction:nullable("string"),organizer:nullable("string"),ticketUrl:nullable("string"),confidence:{type:"number",minimum:0,maximum:1},warnings:{type:"array",items:{type:"string"}},evidence:{type:"array",items:{type:"object",additionalProperties:false,required:["field","quote"],properties:{field:{type:"string"},quote:{type:"string"}}}},
}} as const;

export function validateParsedEvent(value:unknown){const result=parsedEventSchema.parse(value);if(!result.isEvent){return {...result,title:null,description:null,city:null,venue:null,address:null,startDate:null,startTime:null,timeTbd:false,endDate:null,endTime:null,category:null,priceMin:null,priceMax:null,isFree:null,ageRestriction:null,organizer:null,ticketUrl:null}}if(!result.title||!result.startDate)result.warnings.push("Недостаточно данных для публикации: отсутствует title или startDate");return result}
