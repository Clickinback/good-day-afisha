"use client";

import { LoaderCircle, Play } from "lucide-react";
import { useFormStatus } from "react-dom";

export function AutomationRunButton({disabled=false}:{disabled?:boolean}) {
  const { pending } = useFormStatus();
  return (
    <button className="admin-primary automation-run-button" disabled={disabled || pending}>
      {pending ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}
      {pending ? "Автоматизация выполняется…" : "Запустить сейчас"}
    </button>
  );
}

