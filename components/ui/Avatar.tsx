import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function UserAvatar({
  name,
  size = "md",
  className,
  online,
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  online?: boolean;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-[13px]",
    lg: "h-11 w-11 text-base",
  };
  return (
    <span className="relative inline-flex shrink-0" title={name ?? undefined}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-line bg-fill-soft font-medium text-ink",
          sizes[size],
          className,
        )}
      >
        {initials(name)}
      </span>
      {online && (
        <span className="presence absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-presence" />
      )}
    </span>
  );
}
