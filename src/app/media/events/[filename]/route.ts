import { readFile } from "node:fs/promises";
import path from "node:path";
import { collectedImagesDirectory,storedImageFilename } from "@/modules/collectors/image-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mime:Record<string,string>={jpg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif"};

export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}){
  const {filename}=await params;
  if(!storedImageFilename(`/media/events/${filename}`))return new Response(null,{status:404});
  try{
    const bytes=await readFile(path.join(collectedImagesDirectory(),filename));
    const extension=filename.split(".").at(-1)!;
    return new Response(new Uint8Array(bytes),{headers:{"Content-Type":mime[extension],"Content-Length":String(bytes.byteLength),"Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"}});
  }catch(error){
    if((error as NodeJS.ErrnoException).code==="ENOENT")return new Response(null,{status:404});
    throw error;
  }
}
