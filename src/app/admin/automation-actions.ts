"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { runAutomationPipeline,setAutomationPaused } from "@/modules/automation/service";

export async function runAutomationNow() {
  await requireAdmin();
  await runAutomationPipeline("admin");
  revalidatePath("/admin/automation");
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function setAutomationPausedAction(formData:FormData){
  await requireAdmin();
  await setAutomationPaused(String(formData.get("paused"))==="true");
  revalidatePath("/admin/automation");
  revalidatePath("/admin");
}
