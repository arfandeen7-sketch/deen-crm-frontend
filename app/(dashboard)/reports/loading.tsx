import { LoadingState } from "@/components/ui/States";

export default function ReportsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingState label="Loading reports…" />
    </div>
  );
}
