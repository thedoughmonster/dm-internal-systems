// apps/web/app/ui-kit/page.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Copy, Loader2, Terminal, X, Zap } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* sonner toast */
import { toast } from "sonner";

/* --------------------------------------------------------- */

function Section({
  title,
  description,
  children,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs">
      {children}
    </span>
  );
}

function TerminalPanel({
  title,
  lines,
  cursor,
  right,
}: {
  title: string;
  lines: string[];
  cursor?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-black/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <Terminal className="h-4 w-4" />
        <span className="font-medium">{title}</span>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {right}
          <span>/apps/web</span>
        </span>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {lines.join("\n")}
        {cursor ? <span className="dm-cursor ml-1" /> : null}
      </pre>
    </div>
  );
}

function KeyValue({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "ok" | "warn" | "bad" | "info";
}) {
  const toneCls =
    tone === "ok"
      ? "text-emerald-200"
      : tone === "warn"
        ? "text-amber-200"
        : tone === "bad"
          ? "text-red-200"
          : "text-cyan-200";
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{k}:</span>
      <span className={cn("font-mono text-xs", toneCls)}>{v}</span>
    </div>
  );
}

/* --------------------------------------------------------- */

export default function UiKitPage() {
  const pageId = "ui-kit";
  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState("dm-internal-systems");
  const [email, setEmail] = React.useState("ops@dough.monster");
  const [notes, setNotes] = React.useState(
    "This page is the theme canary.\nIf it looks good here, the rest of the app follows."
  );
  const [enabled, setEnabled] = React.useState(true);
  const [checked, setChecked] = React.useState(true);
  const [slider, setSlider] = React.useState<number[]>([55]);
  const [progress, setProgress] = React.useState(32);
  const [tab, setTab] = React.useState("overview");

  React.useEffect(() => {
    if (!loading) return;
    setProgress(18);
    const a = window.setTimeout(() => setProgress(46), 250);
    const b = window.setTimeout(() => setProgress(78), 650);
    const c = window.setTimeout(() => setProgress(100), 1050);
    const d = window.setTimeout(() => {
      setLoading(false);
      setProgress(32);
    }, 1300);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
      window.clearTimeout(d);
    };
  }, [loading]);

  return (
    <TooltipProvider id={`${pageId}-tooltip-provider`}>
      <main className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">UI Kit Samples</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theme canary for internal tools. If it fails here, it fails everywhere.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill>Theme: synth terminal</Pill>
            <Pill>Scope: internal tools</Pill>

            <Button
              id={`${pageId}-toggle-loading`}
              variant="secondary"
              className="gap-2"
              onClick={() => setLoading((v) => !v)}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Toggle loading
            </Button>

            <Button
              id={`${pageId}-toast`}
              variant="outline"
              className="gap-2"
              onClick={() => {
                toast("Sonner toast test", {
                  description: "If this looks good, overlays and z-index are healthy.",
                });
              }}
            >
              Toast
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section
            title="Typography and tokens"
            description="Headings, body, muted, code, badges, separators."
            right={
              <Badge id={`${pageId}-section-typography-badge`} variant="outline">
                baseline
              </Badge>
            }
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-xl font-semibold dm-glow">Headline XL</div>
                <div className="text-base">
                  Body text example for internal UI readability. Tight, crisp, terminal-ish.
                </div>
                <div className="text-sm text-muted-foreground">
                  Muted helper text for hints, labels, and secondary data.
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Inline code</div>
                <code className="mt-1 block text-sm">
                  const mode = &quot;SNIFF_ONLY&quot;; const confidence = &quot;high&quot;;
                </code>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge id={`${pageId}-badge-default`}>default</Badge>
                <Badge id={`${pageId}-badge-secondary`} variant="secondary">
                  secondary
                </Badge>
                <Badge id={`${pageId}-badge-outline`} variant="outline">
                  outline
                </Badge>
                <Badge id={`${pageId}-badge-destructive`} variant="destructive">
                  destructive
                </Badge>
              </div>

              <Separator id={`${pageId}-separator-typography`} />

              <div className="grid gap-1">
                <KeyValue k="status" v="PROPOSED_MATCH" tone="ok" />
                <KeyValue k="proposed.id" v="sysco_invoice_v1" tone="info" />
                <KeyValue k="ambiguity" v="none" tone="ok" />
              </div>
            </div>
          </Section>

          <Section
            title="Buttons, overlays, menus"
            description="Buttons, dropdown, tooltip, popover, dialog, focus rings."
            right={
              <Badge id={`${pageId}-section-interactions-badge`} variant="outline">
                interactions
              </Badge>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button id={`${pageId}-button-primary`}>Primary</Button>
              <Button id={`${pageId}-button-secondary`} variant="secondary">
                Secondary
              </Button>
              <Button id={`${pageId}-button-outline`} variant="outline">
                Outline
              </Button>
              <Button id={`${pageId}-button-destructive`} variant="destructive">
                Destructive
              </Button>
              <Button id={`${pageId}-button-ghost`} variant="ghost">
                Ghost
              </Button>

              <Tooltip id={`${pageId}-tooltip-example`}>
                <TooltipTrigger id={`${pageId}-tooltip-example-trigger`} asChild>
                  <Button id={`${pageId}-button-tooltip`} variant="outline">
                    Tooltip
                  </Button>
                </TooltipTrigger>
                <TooltipContent id={`${pageId}-tooltip-example-content`}>
                  <p>Tooltips should feel crisp, not heavy.</p>
                </TooltipContent>
              </Tooltip>

              <Popover id={`${pageId}-popover-example`}>
                <PopoverTrigger id={`${pageId}-popover-example-trigger`} asChild>
                  <Button
                    id={`${pageId}-button-popover`}
                    variant="outline"
                    className="gap-2"
                  >
                    Popover <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  id={`${pageId}-popover-example-content`}
                  align="start"
                  className="w-[320px]"
                >
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Quick actions</div>
                    <div className="text-sm text-muted-foreground">
                      Overlay surfaces must match the terminal theme.
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        id={`${pageId}-button-popover-confirm`}
                        size="sm"
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" /> Confirm
                      </Button>
                      <Button
                        id={`${pageId}-button-popover-cancel`}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu id={`${pageId}-dropdown-example`}>
                <DropdownMenuTrigger id={`${pageId}-dropdown-example-trigger`} asChild>
                  <Button
                    id={`${pageId}-button-dropdown`}
                    variant="outline"
                    className="gap-2"
                  >
                    Dropdown <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent id={`${pageId}-dropdown-example-content`} align="start">
                  <DropdownMenuLabel id={`${pageId}-dropdown-example-label`}>
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator id={`${pageId}-dropdown-example-separator`} />
                  <DropdownMenuItem id={`${pageId}-dropdown-example-item-inspect`}>
                    Inspect session
                  </DropdownMenuItem>
                  <DropdownMenuItem id={`${pageId}-dropdown-example-item-rerun`}>
                    Re-run analyze
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id={`${pageId}-dropdown-example-item-delete`}
                    className="text-red-300"
                  >
                    Delete draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog id={`${pageId}-dialog-example`}>
                <DialogTrigger id={`${pageId}-dialog-example-trigger`} asChild>
                  <Button id={`${pageId}-button-dialog-open`} variant="outline">
                    Open dialog
                  </Button>
                </DialogTrigger>
                <DialogContent id={`${pageId}-dialog-example-content`} className="sm:max-w-[560px]">
                  <DialogHeader id={`${pageId}-dialog-example-header`}>
                    <DialogTitle id={`${pageId}-dialog-example-title`}>Dialog title</DialogTitle>
                    <DialogDescription id={`${pageId}-dialog-example-description`}>
                      Testing modal surfaces, blur, borders, and focus states.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 text-sm">
                    <Alert id={`${pageId}-dialog-example-alert`}>
                      <Terminal className="h-4 w-4" />
                      <AlertTitle id={`${pageId}-dialog-example-alert-title`}>Heads up</AlertTitle>
                      <AlertDescription id={`${pageId}-dialog-example-alert-description`}>
                        Confirm step writes to Supabase and creates an ingest session.
                      </AlertDescription>
                    </Alert>

                    <div className="rounded-xl border border-border/60 bg-black/30 p-3">
                      <div className="text-xs text-muted-foreground">Example payload</div>
                      <pre className="mt-2 whitespace-pre-wrap text-xs leading-5">
{`{
  "confirm": true,
  "expectedId": "sysco_invoice_v1",
  "csv": "..."
}`}
                      </pre>
                    </div>
                  </div>

                  <DialogFooter id={`${pageId}-dialog-example-footer`}>
                    <Button id={`${pageId}-dialog-example-cancel`} variant="outline">
                      Cancel
                    </Button>
                    <Button id={`${pageId}-dialog-example-confirm`} className="gap-2">
                      <Check className="h-4 w-4" /> Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Section>

          <Section
            title="Forms and inputs"
            description="Input, textarea, select, switch, checkbox, slider, disabled states."
            right={
              <Badge id={`${pageId}-section-forms-badge`} variant="outline">
                forms
              </Badge>
            }
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label id={`${pageId}-label-project`} htmlFor="name">
                  Project
                </Label>
                <Input
                  id="name"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type here..."
                />
              </div>

              <div className="grid gap-2">
                <Label id={`${pageId}-label-email`} htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ops@dough.monster"
                />
              </div>

              <div className="grid gap-2">
                <Label id={`${pageId}-label-notes`} htmlFor="notes">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label id={`${pageId}-label-vendor`}>Vendor</Label>
                <Select id={`${pageId}-select-vendor`} defaultValue="sysco">
                  <SelectTrigger id={`${pageId}-select-vendor-trigger`} className="w-[240px]">
                    <SelectValue id={`${pageId}-select-vendor-value`} placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent id={`${pageId}-select-vendor-content`}>
                    <SelectItem id={`${pageId}-select-vendor-item-sysco`} value="sysco">
                      Sysco
                    </SelectItem>
                    <SelectItem id={`${pageId}-select-vendor-item-webstaurant`} value="webstaurant">
                      Webstaurant
                    </SelectItem>
                    <SelectItem id={`${pageId}-select-vendor-item-amazon`} value="amazon">
                      Amazon
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    id={`${pageId}-switch-enabled`}
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                  <span className="text-sm">Enabled</span>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`${pageId}-checkbox-example`}
                    checked={checked}
                    onCheckedChange={(v) => setChecked(Boolean(v))}
                  />
                  <span className="text-sm">Checkbox</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label id={`${pageId}-label-threshold`}>Match threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id={`${pageId}-slider-threshold`}
                    value={slider}
                    onValueChange={setSlider}
                    className="max-w-[320px]"
                  />
                  <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                    {slider[0]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button id={`${pageId}-button-save`} className="gap-2">
                  <Check className="h-4 w-4" /> Save
                </Button>
                <Button id={`${pageId}-button-queue`} variant="secondary" className="gap-2">
                  <Loader2 className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                  Queue
                </Button>
                <Button id={`${pageId}-button-disabled`} variant="outline" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </Section>

          <Section
            title="States, alerts, progress, skeleton"
            description="Loading, success, warning, error, progress, skeletons."
            right={
              <Badge id={`${pageId}-section-states-badge`} variant="outline">
                states
              </Badge>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Ingest progress</div>
                  <div className="font-mono text-xs text-muted-foreground">{progress}%</div>
                </div>
                <Progress id={`${pageId}-progress`} value={progress} />
                <div className="flex gap-2">
                  <Button
                    id={`${pageId}-progress-run`}
                    size="sm"
                    onClick={() => setLoading(true)}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Run
                  </Button>
                  <Button
                    id={`${pageId}-progress-reset`}
                    size="sm"
                    variant="outline"
                    onClick={() => setProgress(32)}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Alert id={`${pageId}-alert-ok`}>
                  <Check className="h-4 w-4" />
                  <AlertTitle id={`${pageId}-alert-ok-title`}>OK</AlertTitle>
                  <AlertDescription id={`${pageId}-alert-ok-description`}>
                    Detected sysco_invoice_v1 with high confidence.
                  </AlertDescription>
                </Alert>

                <Alert id={`${pageId}-alert-warning`} className="border-amber-500/40 bg-amber-500/10">
                  <Zap className="h-4 w-4" />
                  <AlertTitle id={`${pageId}-alert-warning-title`} className="text-amber-100">
                    Warning
                  </AlertTitle>
                  <AlertDescription id={`${pageId}-alert-warning-description`} className="text-amber-100/80">
                    Some lines were skipped due to malformed fields.
                  </AlertDescription>
                </Alert>

                <Alert id={`${pageId}-alert-error`} className="border-red-500/40 bg-red-500/10">
                  <X className="h-4 w-4" />
                  <AlertTitle id={`${pageId}-alert-error-title`} className="text-red-100">
                    Error
                  </AlertTitle>
                  <AlertDescription id={`${pageId}-alert-error-description`} className="text-red-100/80">
                    Could not parse CSV. Missing header record.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid gap-2">
                <div className="text-sm text-muted-foreground">Skeleton</div>
                <div className="space-y-2">
                  <Skeleton id={`${pageId}-skeleton-line-1`} className="h-4 w-2/3" />
                  <Skeleton id={`${pageId}-skeleton-line-2`} className="h-4 w-1/2" />
                  <Skeleton id={`${pageId}-skeleton-block`} className="h-24 w-full" />
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Tabs, accordion, table"
            description="Navigation density and data readability."
            right={
              <Badge id={`${pageId}-section-data-badge`} variant="outline">
                data
              </Badge>
            }
          >
            <div className="space-y-4">
              <Tabs id={`${pageId}-tabs`} value={tab} onValueChange={setTab}>
                <TabsList id={`${pageId}-tabs-list`}>
                  <TabsTrigger id={`${pageId}-tabs-trigger-overview`} value="overview">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger id={`${pageId}-tabs-trigger-details`} value="details">
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent id={`${pageId}-tabs-content-overview`} value="overview" className="mt-3 space-y-3">
                  <Card
                    id={`${pageId}-summary-card`}
                    headerTitle="Ingest summary"
                  >
                    <CardContent id={`${pageId}-summary-card-content`} className="grid gap-2">
                      <p className="text-xs text-muted-foreground">
                        Small cards must still feel like a terminal panel.
                      </p>
                      <KeyValue k="mode" v="SNIFF_ONLY" tone="info" />
                      <KeyValue k="results" v="2 identifiers" tone="ok" />
                      <KeyValue k="session" v="draft" tone="warn" />
                    </CardContent>
                  </Card>

                  <Accordion id={`${pageId}-accordion`} type="single" collapsible>
                    <AccordionItem id={`${pageId}-accordion-item-1`} value="item-1">
                      <AccordionTrigger id={`${pageId}-accordion-trigger-1`}>
                        What is confirm?
                      </AccordionTrigger>
                      <AccordionContent id={`${pageId}-accordion-content-1`} className="text-sm text-muted-foreground">
                        Confirm locks the expectedId and writes a session. Sniff-only is read-only.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem id={`${pageId}-accordion-item-2`} value="item-2">
                      <AccordionTrigger id={`${pageId}-accordion-trigger-2`}>
                        Where do unmatched SKUs go?
                      </AccordionTrigger>
                      <AccordionContent id={`${pageId}-accordion-content-2`} className="text-sm text-muted-foreground">
                        Into the unmatched queue for manual review, then mapped to catalog items.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent id={`${pageId}-tabs-content-details`} value="details" className="mt-3 space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table id={`${pageId}-table`}>
                      <TableHeader id={`${pageId}-table-header`}>
                        <TableRow id={`${pageId}-table-header-row`} className="bg-muted/30">
                          <TableHead id={`${pageId}-table-head-sku`}>SKU</TableHead>
                          <TableHead id={`${pageId}-table-head-description`}>Description</TableHead>
                          <TableHead id={`${pageId}-table-head-case`} className="text-right">Case $</TableHead>
                          <TableHead id={`${pageId}-table-head-each`} className="text-right">Each $</TableHead>
                          <TableHead id={`${pageId}-table-head-status`}>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody id={`${pageId}-table-body`} className="bg-background/20">
                        {[
                          { sku: "12345", desc: "Flour, high gluten", case: "34.90", each: "1.74", status: "Matched" },
                          { sku: "77881", desc: "Butter, unsalted", case: "92.10", each: "4.61", status: "Needs review" },
                          { sku: "99001", desc: "Yeast, instant", case: "18.50", each: "0.93", status: "Unmatched" },
                        ].map((r) => (
                          <TableRow
                            id={`${pageId}-table-row-${r.sku}`}
                            key={r.sku}
                            className="border-t border-border/40"
                          >
                            <TableCell id={`${pageId}-table-cell-${r.sku}-sku`} className="font-mono text-xs">
                              {r.sku}
                            </TableCell>
                            <TableCell id={`${pageId}-table-cell-${r.sku}-desc`}>{r.desc}</TableCell>
                            <TableCell id={`${pageId}-table-cell-${r.sku}-case`} className="text-right tabular-nums">
                              {r.case}
                            </TableCell>
                            <TableCell id={`${pageId}-table-cell-${r.sku}-each`} className="text-right tabular-nums">
                              {r.each}
                            </TableCell>
                            <TableCell id={`${pageId}-table-cell-${r.sku}-status`}>
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 text-xs",
                                  r.status === "Matched" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
                                  r.status === "Needs review" && "border-amber-500/40 bg-amber-500/10 text-amber-200",
                                  r.status === "Unmatched" && "border-red-500/40 bg-red-500/10 text-red-200"
                                )}
                              >
                                {r.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      id={`${pageId}-button-run-action`}
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        await new Promise((r) => setTimeout(r, 700));
                        setLoading(false);
                      }}
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Running
                        </span>
                      ) : (
                        "Run action"
                      )}
                    </Button>

                    <Button id={`${pageId}-button-secondary-action`} variant="secondary">
                      Secondary action
                    </Button>

                    <Button
                      id={`${pageId}-button-copy-id`}
                      variant="outline"
                      className="gap-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText("sysco_invoice_v1");
                          toast("Copied", { description: "sysco_invoice_v1" });
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copy id
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Section>

          <Section
            title="Terminal widgets"
            description="Panels, cursor, log feel, density."
            right={
              <Badge id={`${pageId}-section-fun-badge`} variant="outline">
                fun
              </Badge>
            }
          >
            <div className="grid gap-3">
              <TerminalPanel
                title="vendor_ingest"
                right={<span className="dm-flicker">LIVE</span>}
                lines={[
                  "$ curl -X POST /functions/v1/vendor_ingest",
                  "status: PROPOSED_MATCH",
                  "proposed.id: sysco_invoice_v1",
                  "confidence: high",
                  "",
                  "next: POST confirm=true expectedId=sysco_invoice_v1",
                ]}
                cursor
              />
              <TerminalPanel
                title="kitchen-brain"
                lines={[
                  "[ok] db connected",
                  "[ok] edge function deployed",
                  "[warn] awaiting confirm step",
                ]}
              />
              <Loader id={`${pageId}-loader`} label="hacker loader" />
            </div>
          </Section>
        </div>
      </main>
    </TooltipProvider>
  );
}
