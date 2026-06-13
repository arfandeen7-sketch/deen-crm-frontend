import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const palette = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function colorFor(name?: string | null) {
  if (!name) return palette[0];
  const sum = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

export function UserAvatar({
  name,
  size = "md",
  className,
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        sizes[size],
        colorFor(name),
        className,
      )}
      title={name ?? undefined}
    >
      {initials(name)}
    </span>
  );
}
