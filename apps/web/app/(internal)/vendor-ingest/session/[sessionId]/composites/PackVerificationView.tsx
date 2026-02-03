import { Badge } from "@/components/ui/badge";
import PackVerificationPanel from "./PackVerificationPanel";

type PackVerificationViewProps = {
  sessionId: string;
};

export default function PackVerificationView({
  sessionId,
}: PackVerificationViewProps) {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Pack verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify pack string parses and apply them to vendor catalog items.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge id={`pack-verification-${sessionId}-badge-ingest`} variant="outline">
            Vendor ingest
          </Badge>
          <Badge id={`pack-verification-${sessionId}-badge-session`} variant="outline">
            Session {sessionId.slice(0, 8)}
          </Badge>
        </div>
      </div>

      <PackVerificationPanel sessionId={sessionId} />
    </main>
  );
}
