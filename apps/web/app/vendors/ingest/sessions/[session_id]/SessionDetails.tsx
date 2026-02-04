import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PackIntent } from "../../lib/types";

export type SessionRecord = {
  id: string;
  created_at: string;
  vendor_id: string;
  handler_id: string;
  filename: string | null;
  proposed: Record<string, unknown> | null;
  confirm_meta: Record<string, unknown> | null;
  write_summary: Record<string, unknown> | null;
  audit: Record<string, unknown> | null;
  vendor_invoice_id: string | null;
};

function renderJson(value: Record<string, unknown> | null) {
  return JSON.stringify(value, null, 2);
}

function getPackIntent(writeSummary: Record<string, unknown> | null): PackIntent | null {
  if (!writeSummary || typeof writeSummary !== "object") return null;
  const maybe = (writeSummary as { packIntent?: unknown }).packIntent;
  if (!maybe || typeof maybe !== "object") return null;
  return maybe as PackIntent;
}

export default function SessionDetails({
  session,
}: {
  session: SessionRecord;
}) {
  const detailId = `session-details-${session.id}`.replace(/[^a-z0-9]+/gi, "-")
  const packIntent = getPackIntent(session.write_summary);
  const packGroups = packIntent?.unmappedPackGroups ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendor ingest session</h1>
          <p className="text-sm text-muted-foreground">
            Human readable summary with raw JSON available on demand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge id={`${detailId}-badge-session`} variant="outline">
            Session {session.id}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4">
        <Card
          id={`${detailId}-summary-card`}
          className="border-border/70 bg-card/60"
          headerTitle="Session details"
        >
          <CardContent id={`${detailId}-summary-content`} className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Created</span>
              <span className="font-mono text-xs text-foreground/90">{session.created_at}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Vendor ID</span>
              <span className="font-mono text-xs text-foreground/90">{session.vendor_id}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Handler</span>
              <span className="font-mono text-xs text-foreground/90">{session.handler_id}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Filename</span>
              <span className="text-sm text-foreground/90">{session.filename ?? "n/a"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Invoice ID</span>
              <span className="text-sm text-foreground/90">{session.vendor_invoice_id ?? "n/a"}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator id={`${detailId}-separator`} />

      <section className="space-y-4">
        <Accordion
          id={`${detailId}-accordion`}
          type="single"
          collapsible
          variant="sidebar"
          defaultValue="pack-sizes"
        >
          <AccordionItem id={`${detailId}-accordion-pack-sizes`} value="pack-sizes">
            <AccordionTrigger id={`${detailId}-accordion-pack-sizes-trigger`}>
              Pack sizes at ingest time
            </AccordionTrigger>
            <AccordionContent id={`${detailId}-accordion-pack-sizes-content`}>
              <Card
                id={`${detailId}-pack-sizes-card`}
                className="border-border/70 bg-card/60"
                headerTitle="Pack sizes at ingest time"
              >
                <CardContent id={`${detailId}-pack-sizes-content`} className="space-y-3 text-sm text-muted-foreground">
                  <p>Snapshot captured at ingest time. Use pack mapping to update interpretations.</p>
                  <details className="rounded-md border border-border/60 bg-background/40 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">
                      {packIntent?.applicable
                        ? packIntent.unmappedPackGroupCount > 0
                          ? `Unmapped at ingest time (${packIntent.unmappedPackGroupCount} groups)`
                          : "Pack sizes at ingest time (no unmapped groups)"
                        : "Pack sizes not available"}
                    </summary>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                      {packIntent?.applicable ? (
                        packGroups.length > 0 ? (
                          <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40">
                            <Table id={`${detailId}-pack-sizes-table`}>
                              <TableHeader
                                id={`${detailId}-pack-sizes-table-header`}
                                className="text-xs uppercase tracking-wide text-muted-foreground"
                              >
                                <TableRow id={`${detailId}-pack-sizes-table-header-row`} className="border-border/40">
                                  <TableHead id={`${detailId}-pack-sizes-head-pack`} className="p-3">
                                    Pack string
                                  </TableHead>
                                  <TableHead id={`${detailId}-pack-sizes-head-lines`} className="p-3">
                                    Lines
                                  </TableHead>
                                  <TableHead id={`${detailId}-pack-sizes-head-samples`} className="p-3">
                                    Samples
                                  </TableHead>
                                  <TableHead id={`${detailId}-pack-sizes-head-sample-line`} className="p-3">
                                    Sample line
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody id={`${detailId}-pack-sizes-table-body`}>
                                {packGroups.map((group) => (
                                  <TableRow
                                    id={`${detailId}-pack-sizes-row-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}`}
                                    key={group.packStringNormalized}
                                    className="border-border/40"
                                  >
                                    <TableCell
                                      id={`${detailId}-pack-sizes-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-pack`}
                                      className="p-3 text-xs font-mono"
                                    >
                                      {group.packStringNormalized}
                                    </TableCell>
                                    <TableCell
                                      id={`${detailId}-pack-sizes-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-lines`}
                                      className="p-3 text-xs"
                                    >
                                      {group.lineCount}
                                    </TableCell>
                                    <TableCell
                                      id={`${detailId}-pack-sizes-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-samples`}
                                      className="p-3 text-xs"
                                    >
                                      {group.rawSamples.length > 0 ? (
                                        <div className="grid gap-1">
                                          {group.rawSamples.map((sample) => (
                                            <div key={sample} className="font-mono text-xs text-muted-foreground">
                                              {sample}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">n/a</span>
                                      )}
                                    </TableCell>
                                    <TableCell
                                      id={`${detailId}-pack-sizes-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-sample-line`}
                                      className="p-3 text-xs"
                                    >
                                      {group.sampleLine.vendorSku || group.sampleLine.description ? (
                                        <div className="grid gap-1">
                                          {group.sampleLine.vendorSku ? (
                                            <div className="font-mono text-xs">{group.sampleLine.vendorSku}</div>
                                          ) : null}
                                          {group.sampleLine.description ? (
                                            <div className="text-muted-foreground">
                                              {group.sampleLine.description}
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">n/a</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            No unmapped pack sizes at ingest time.
                          </div>
                        )
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Pack sizes not available for this session.
                        </div>
                      )}
                      <Button id={`${detailId}-pack-mapping-link`} variant="secondary" size="sm" asChild>
                        <Link href="/vendors/ingest/pack-mapping">Open pack mapping</Link>
                      </Button>
                    </div>
                  </details>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          {[
            { key: "proposed", title: "Proposed", value: session.proposed },
            { key: "confirm-meta", title: "Confirm Meta", value: session.confirm_meta },
            { key: "write-summary", title: "Write Summary", value: session.write_summary },
            { key: "audit", title: "Audit", value: session.audit },
          ].map((block) => (
            <AccordionItem id={`${detailId}-accordion-${block.key}`} key={block.key} value={block.key}>
              <AccordionTrigger id={`${detailId}-accordion-${block.key}-trigger`}>
                {block.title}
              </AccordionTrigger>
              <AccordionContent id={`${detailId}-accordion-${block.key}-content`}>
                <Card
                  id={`${detailId}-card-${block.key}`}
                  className="border-border/70 bg-card/60"
                  headerTitle={block.title}
                >
                  <CardContent id={`${detailId}-card-${block.key}-content`} className="space-y-3 text-sm text-muted-foreground">
                    <details className="rounded-md border border-border/60 bg-background/40 p-3">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Raw JSON
                      </summary>
                      <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
                        {renderJson(block.value)}
                      </pre>
                    </details>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
