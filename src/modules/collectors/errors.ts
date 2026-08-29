import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordSystemError(component:string,operation:string,error:unknown,context?:Record<string,unknown>){const message=error instanceof Error?error.message:String(error);const stack=error instanceof Error?error.stack:undefined;const fingerprint=createHash("sha256").update(`${component}:${operation}:${message}`).digest("hex");const existing=await prisma.systemError.findFirst({where:{fingerprint,resolvedAt:null}});if(existing)return prisma.systemError.update({where:{id:existing.id},data:{lastSeenAt:new Date(),occurrenceCount:{increment:1},stack,context:context as Prisma.InputJsonValue|undefined}});return prisma.systemError.create({data:{component,operation,message,stack,fingerprint,context:context as Prisma.InputJsonValue|undefined}})}
