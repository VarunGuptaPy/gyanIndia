import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { cls: "border-royal/20 bg-royal-50 text-navy", Icon: Info, icon: "text-royal" },
  success: { cls: "border-success/20 bg-success-50 text-navy", Icon: CheckCircle2, icon: "text-success" },
  warning: { cls: "border-warning/25 bg-warning-50 text-navy", Icon: AlertTriangle, icon: "text-warning" },
  danger: { cls: "border-danger/20 bg-danger-50 text-navy", Icon: XCircle, icon: "text-danger" },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3.5 text-sm", t.cls, className)}>
      <t.Icon className={cn("mt-0.5 size-[18px] shrink-0", t.icon)} aria-hidden />
      <div className="space-y-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink/80">{children}</div>}
      </div>
    </div>
  );
}
