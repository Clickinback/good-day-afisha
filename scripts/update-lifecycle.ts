import { prisma } from "../src/lib/prisma";import { runLifecycle } from "../src/modules/lifecycle/service";
runLifecycle().then(result=>console.log(JSON.stringify(result,null,2))).finally(()=>prisma.$disconnect());
