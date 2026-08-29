import { deduplicateBatch } from "../src/modules/deduplication/service";
import { prisma } from "../src/lib/prisma";
const limit=Number(process.argv[2]??20);
deduplicateBatch(limit).then(results=>console.table(results)).catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
