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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <TooltipProvider>
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
              variant="secondary"
              className="gap-2"
              onClick={() => setLoading((v) => !v)}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Toggle loading
            </Button>

            <Button
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
            right={<Badge variant="outline">baseline</Badge>}
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
                  const mode = "SNIFF_ONLY"; const confidence = "high";
                </code>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>default</Badge>
                <Badge variant="secondary">secondary</Badge>
                <Badge variant="outline">outline</Badge>
                <Badge variant="destructive">destructive</Badge>
              </div>

              <Separator />

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
            right={<Badge variant="outline">interactions</Badge>}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tooltips should feel crisp, not heavy.</p>
                </TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Popover <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[320px]">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Quick actions</div>
                    <div className="text-sm text-muted-foreground">
                      Overlay surfaces must match the terminal theme.
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="gap-2">
                        <Check className="h-4 w-4" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Dropdown <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Inspect session</DropdownMenuItem>
                  <DropdownMenuItem>Re-run analyze</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-300">Delete draft</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open dialog</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle>Dialog title</DialogTitle>
                    <DialogDescription>
                      Testing modal surfaces, blur, borders, and focus states.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 text-sm">
                    <Alert>
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Heads up</AlertTitle>
                      <AlertDescription>
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

                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button className="gap-2">
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
            right={<Badge variant="outline">forms</Badge>}
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project</Label>
                <Input
                  id="name"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type here..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ops@dough.monster"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Vendor</Label>
                <Select defaultValue="sysco">
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sysco">Sysco</SelectItem>
                    <SelectItem value="webstaurant">Webstaurant</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                  <span className="text-sm">Enabled</span>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
                  <span className="text-sm">Checkbox</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Match threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider value={slider} onValueChange={setSlider} className="max-w-[320px]" />
                  <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                    {slider[0]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="gap-2">
                  <Check className="h-4 w-4" /> Save
                </Button>
                <Button variant="secondary" className="gap-2">
                  <Loader2 className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                  Queue
                </Button>
                <Button variant="outline" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </Section>

          <Section
            title="States, alerts, progress, skeleton"
            description="Loading, success, warning, error, progress, skeletons."
            right={<Badge variant="outline">states</Badge>}
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Ingest progress</div>
                  <div className="font-mono text-xs text-muted-foreground">{progress}%</div>
                </div>
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setLoading(true)}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Run
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setProgress(32)}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>OK</AlertTitle>
                  <AlertDescription>Detected sysco_invoice_v1 with high confidence.</AlertDescription>
                </Alert>

                <Alert className="border-amber-500/40 bg-amber-500/10">
                  <Zap className="h-4 w-4" />
                  <AlertTitle className="text-amber-100">Warning</AlertTitle>
                  <AlertDescription className="text-amber-100/80">
                    Some lines were skipped due to malformed fields.
                  </AlertDescription>
                </Alert>

                <Alert className="border-red-500/40 bg-red-500/10">
                  <X className="h-4 w-4" />
                  <AlertTitle className="text-red-100">Error</AlertTitle>
                  <AlertDescription className="text-red-100/80">
                    Could not parse CSV. Missing header record.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid gap-2">
                <div className="text-sm text-muted-foreground">Skeleton</div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Tabs, accordion, table"
            description="Navigation density and data readability."
            right={<Badge variant="outline">data</Badge>}
          >
            <div className="space-y-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-3 space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ingest summary</CardTitle>
                      <CardDescription>
                        Small cards must still feel like a terminal panel.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      <KeyValue k="mode" v="SNIFF_ONLY" tone="info" />
                      <KeyValue k="results" v="2 identifiers" tone="ok" />
                      <KeyValue k="session" v="draft" tone="warn" />
                    </CardContent>
                  </Card>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>What is confirm?</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        Confirm locks the expectedId and writes a session. Sniff-only is read-only.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Where do unmatched SKUs go?</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        Into the unmatched queue for manual review, then mapped to catalog items.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="details" className="mt-3 space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>SKU</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Case $</TableHead>
                          <TableHead className="text-right">Each $</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-background/20">
                        {[
                          { sku: "12345", desc: "Flour, high gluten", case: "34.90", each: "1.74", status: "Matched" },
                          { sku: "77881", desc: "Butter, unsalted", case: "92.10", each: "4.61", status: "Needs review" },
                          { sku: "99001", desc: "Yeast, instant", case: "18.50", each: "0.93", status: "Unmatched" },
                        ].map((r) => (
                          <TableRow key={r.sku} className="border-t border-border/40">
                            <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                            <TableCell>{r.desc}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.case}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.each}</TableCell>
                            <TableCell>
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

                    <Button variant="secondary">Secondary action</Button>

                    <Button
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
            right={<Badge variant="outline">fun</Badge>}
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
<Loader label="hacker loader" />
            </div>
          </Section>
        </div>
      </main>
    </TooltipProvider>
  );
}