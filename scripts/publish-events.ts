import { evaluatePublicationBatch } from "../src/modules/publication/service";
import { prisma } from "../src/lib/prisma";
const limit=Number(process.argv[2]??50);
evaluatePublicationBatch(limit).then(results=>console.table(results)).catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
