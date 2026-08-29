import { createHash } from "node:crypto";
import { mkdir,rename,unlink,writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSafeUrl } from "./http";

const MAX_IMAGE_BYTES=8_000_000;
const contentTypes:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"};

export function isPersistableImageUrl(value:string){try{const url=new URL(value);return url.protocol==="https:"&&(/^cdn\d*\.telesco\.pe$/i.test(url.hostname)||(url.hostname==="hubl.by"&&url.pathname.startsWith("/storage/")))}catch{return false}}
export const extensionForContentType=(value:string)=>contentTypes[value.split(";")[0].trim().toLowerCase()]??null;

export async function persistCollectedImage(value:string){
  if(!isPersistableImageUrl(value))return null;
  const url=await assertSafeUrl(value);
  const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(15_000),headers:{"user-agent":process.env.COLLECTOR_USER_AGENT??"GoodDayAfishaBot/0.1","accept":"image/jpeg,image/png,image/webp,image/gif"}});
  if(!response.ok)throw new Error(`Image HTTP ${response.status} ${response.statusText}`);
  const extension=extensionForContentType(response.headers.get("content-type")??"");
  if(!extension)throw new Error("Неподдерживаемый MIME-тип изображения");
  const declaredSize=Number(response.headers.get("content-length")??0);
  if(declaredSize>MAX_IMAGE_BYTES)throw new Error("Изображение превышает 8 МБ");
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.byteLength>MAX_IMAGE_BYTES)throw new Error("Изображение превышает 8 МБ");
  const hash=createHash("sha256").update(bytes).digest("hex");
  const directory=path.join(process.cwd(),"public","media","events");
  const filename=`${hash}.${extension}`;
  const target=path.join(directory,filename);
  const temporary=path.join(directory,`.${hash}-${process.pid}.tmp`);
  await mkdir(directory,{recursive:true});
  try{await writeFile(temporary,bytes,{flag:"wx"});await rename(temporary,target)}catch(error){if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;await unlink(temporary).catch(()=>undefined)}
  return `/media/events/${filename}`;
}
