import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SessionRow = {
  id: string;
  created_at: string;
  handler_id: string;
  filename: string | null;
  proposed: {
    vendorKey?: string | null;
    documentType?: string | null;
    formatVersion?: number | null;
  } | null;
  vendor_invoice_id: string | null;
};

type VendorsIngestSessionsViewProps = {
  sessions: SessionRow[];
  errorMessage: string | null;
  showPackIntent: boolean;
};

export default function VendorsIngestSessionsView({
  sessions,
  errorMessage,
  showPackIntent,
}: VendorsIngestSessionsViewProps) {
  const viewId = "vendor-ingest-sessions";
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Vendor ingest sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest 50 ingest sessions ordered by creation time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge id={`${viewId}-badge-count`} variant="outline">
            Sessions {sessions.length}
          </Badge>
          {showPackIntent ? (
            <Badge id={`${viewId}-badge-pack-intent`} variant="outline">
              Pack intent
            </Badge>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <Card id={`${viewId}-error-card`}>
          <CardHeader id={`${viewId}-error-header`}>
            <CardTitle id={`${viewId}-error-title`}>Unable to load sessions</CardTitle>
            <CardDescription id={`${viewId}-error-description`}>
              Check Supabase connectivity and credentials.
            </CardDescription>
          </CardHeader>
          <CardContent id={`${viewId}-error-content`}>
            <p className="text-sm text-destructive break-words">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card id={`${viewId}-empty-card`}>
          <CardHeader id={`${viewId}-empty-header`}>
            <CardTitle id={`${viewId}-empty-title`}>No sessions yet</CardTitle>
            <CardDescription id={`${viewId}-empty-description`}>
              Upload an invoice to start a new ingest.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card id={`${viewId}-list-card`} className="border-border/60 bg-card/40">
          <CardHeader id={`${viewId}-list-header`}>
            <CardTitle id={`${viewId}-list-title`}>Session list</CardTitle>
            <CardDescription id={`${viewId}-list-description`}>
              Open a session to review ingest details.
            </CardDescription>
          </CardHeader>
          <CardContent id={`${viewId}-list-content`}>
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
              <Table id={`${viewId}-table`}>
                <TableHeader
                  id={`${viewId}-table-header`}
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  <TableRow id={`${viewId}-table-header-row`} className="border-border/40">
                    <TableHead id={`${viewId}-table-head-created`} className="p-3">
                      Created
                    </TableHead>
                    <TableHead id={`${viewId}-table-head-handler`} className="p-3">
                      Handler
                    </TableHead>
                    <TableHead id={`${viewId}-table-head-filename`} className="p-3">
                      Filename
                    </TableHead>
                    <TableHead id={`${viewId}-table-head-vendor-key`} className="p-3">
                      Vendor key
                    </TableHead>
                    <TableHead id={`${viewId}-table-head-doc-type`} className="p-3">
                      Document type
                    </TableHead>
                    <TableHead id={`${viewId}-table-head-format`} className="p-3">
                      Format version
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody id={`${viewId}-table-body`}>
                  {sessions.map((session) => (
                    <TableRow
                      id={`${viewId}-table-row-${session.id}`}
                      key={session.id}
                      className="border-border/40"
                    >
                      <TableCell id={`${viewId}-table-cell-created-${session.id}`} className="p-3 text-sm">
                        <Button id={`${viewId}-session-link-${session.id}`} variant="link" size="sm" asChild>
                          <Link href={`/vendors/ingest/sessions/${session.id}`}>
                            <span className="font-mono text-xs text-foreground/90">
                              {session.created_at}
                            </span>
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell id={`${viewId}-table-cell-handler-${session.id}`} className="p-3 text-sm">
                        <span className="font-mono text-xs text-foreground/90">
                          {session.handler_id}
                        </span>
                      </TableCell>
                      <TableCell id={`${viewId}-table-cell-filename-${session.id}`} className="p-3 text-sm">
                        {session.filename ? (
                          session.filename
                        ) : (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell id={`${viewId}-table-cell-vendor-key-${session.id}`} className="p-3 text-sm">
                        {session.proposed?.vendorKey ?? (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell id={`${viewId}-table-cell-doc-type-${session.id}`} className="p-3 text-sm">
                        {session.proposed?.documentType ?? (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell id={`${viewId}-table-cell-format-${session.id}`} className="p-3 text-sm">
                        {session.proposed?.formatVersion ?? (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
