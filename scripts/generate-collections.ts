import { prisma } from "../src/lib/prisma";import { generateCollections } from "../src/modules/collections/service";
generateCollections().then(result=>console.log(JSON.stringify(result,null,2))).finally(()=>prisma.$disconnect());
