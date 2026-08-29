import { processRawEventBatch } from "../src/modules/ai-parser/service";
import { prisma } from "../src/lib/prisma";
const limit=Number(process.argv[2]??10);
processRawEventBatch(limit).then(results=>{console.table(results);if(results.some(item=>item.status==="FAILED"))process.exitCode=1}).catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
