import { collectActiveSources } from "../src/modules/collectors/service";
import { prisma } from "../src/lib/prisma";
async function main(){const results=await collectActiveSources();console.table(results);if(results.some(item=>item.status==="FAILED"))process.exitCode=1}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
