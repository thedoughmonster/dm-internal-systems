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
          <Badge variant="outline">Sessions {sessions.length}</Badge>
          {showPackIntent ? <Badge variant="outline">Pack intent</Badge> : null}
        </div>
      </div>

      {errorMessage ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load sessions</CardTitle>
            <CardDescription>Check Supabase connectivity and credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive break-words">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sessions yet</CardTitle>
            <CardDescription>Upload an invoice to start a new ingest.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-border/60 bg-card/40">
          <CardHeader>
            <CardTitle>Session list</CardTitle>
            <CardDescription>Open a session to review ingest details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
              <Table>
                <TableHeader className="text-xs uppercase tracking-wide text-muted-foreground">
                  <TableRow className="border-border/40">
                    <TableHead className="p-3">Created</TableHead>
                    <TableHead className="p-3">Handler</TableHead>
                    <TableHead className="p-3">Filename</TableHead>
                    <TableHead className="p-3">Vendor key</TableHead>
                    <TableHead className="p-3">Document type</TableHead>
                    <TableHead className="p-3">Format version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} className="border-border/40">
                      <TableCell className="p-3 text-sm">
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/vendors/ingest/sessions/${session.id}`}>
                            <span className="font-mono text-xs text-foreground/90">
                              {session.created_at}
                            </span>
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        <span className="font-mono text-xs text-foreground/90">
                          {session.handler_id}
                        </span>
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {session.filename ? (
                          session.filename
                        ) : (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {session.proposed?.vendorKey ?? (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {session.proposed?.documentType ?? (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
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
