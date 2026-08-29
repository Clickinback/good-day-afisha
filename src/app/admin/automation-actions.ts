"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { runAutomationPipeline } from "@/modules/automation/service";

export async function runAutomationNow() {
  await requireAdmin();
  await runAutomationPipeline("admin");
  revalidatePath("/admin/automation");
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

