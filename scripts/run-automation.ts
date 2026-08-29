import { prisma } from "../src/lib/prisma";
import { runAutomationPipeline } from "../src/modules/automation/service";

runAutomationPipeline("cli")
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "FAILED" || result.status === "LOCKED") process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

