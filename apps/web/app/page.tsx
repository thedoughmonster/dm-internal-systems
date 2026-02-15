"use client";

import * as React from "react";
import { Activity, AlertTriangle, ChartColumn, DatabaseZap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const chartConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const openIncidents = [
  { id: "INC-291", service: "Vendor Ingest", severity: "Medium", owner: "Ops Platform" },
  { id: "INC-304", service: "Catalog Sync", severity: "Low", owner: "Data Infra" },
  { id: "INC-317", service: "Price Changes", severity: "High", owner: "Vendor Team" },
];

const recentEvents = [
  {
    system: "Vendor ingest",
    event: "Session #9184 confirmed",
    actor: "ops@dm.internal",
    status: "Healthy",
    age: "3m",
  },
  {
    system: "Inventory mirrors",
    event: "Warehouse feed settled",
    actor: "scheduler",
    status: "Healthy",
    age: "11m",
  },
  {
    system: "Purchasing planner",
    event: "Forecast model refresh complete",
    actor: "forecast.bot",
    status: "Watching",
    age: "26m",
  },
  {
    system: "Vendor ingest",
    event: "CSV parse retries exhausted",
    actor: "ingest.worker",
    status: "Needs review",
    age: "41m",
  },
];

export default function Home() {
  const throughputData = React.useMemo(() => {
    let baseline = 360 + Math.floor(pseudoRandom(1) * 45);
    return Array.from({ length: 14 }).map((_, index) => {
      const jitter = Math.floor(pseudoRandom(index + 2) * 90) - 25;
      baseline = Math.max(250, baseline + jitter);
      return {
        day: `${dayLabels[index % dayLabels.length]} ${index + 1}`,
        orders: baseline,
      };
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">DM Internal Systems</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified operations dashboard for ingest, catalog health, purchasing, and risk.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge id="home-env-badge" variant="outline">
            env: staging
          </Badge>
          <Badge id="home-updated-badge" variant="secondary">
            updated 2m ago
          </Badge>
        </div>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card id="home-kpi-availability" headerTitle="Platform Availability">
          <CardContent id="home-kpi-availability-content" className="space-y-3">
            <div className="text-3xl font-semibold text-emerald-300">99.94%</div>
            <Progress id="home-kpi-availability-progress" value={99.94} className="h-2" />
            <p className="text-xs text-muted-foreground">Rolling 30-day SLA across core services</p>
          </CardContent>
        </Card>

        <Card id="home-kpi-ingest" headerTitle="Daily Ingest Volume">
          <CardContent id="home-kpi-ingest-content" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-semibold">4,832</span>
              <DatabaseZap className="h-5 w-5 text-cyan-300" />
            </div>
            <p className="text-xs text-muted-foreground">Rows processed in the last 24 hours</p>
          </CardContent>
        </Card>

        <Card id="home-kpi-incidents" headerTitle="Open Incidents">
          <CardContent id="home-kpi-incidents-content" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-semibold">3</span>
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>
            <p className="text-xs text-muted-foreground">1 high, 1 medium, 1 low priority issue</p>
          </CardContent>
        </Card>

        <Card id="home-kpi-latency" headerTitle="Median API Latency">
          <CardContent id="home-kpi-latency-content" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-semibold">184ms</span>
              <Activity className="h-5 w-5 text-violet-300" />
            </div>
            <p className="text-xs text-muted-foreground">P95 is 436ms across edge + internal APIs</p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.6fr,1fr]">
        <Card id="home-throughput-card" headerTitle="Order Throughput Trend (Mock Data)">
          <CardContent id="home-throughput-card-content" className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ChartColumn className="h-3.5 w-3.5" />
              Last 14 days, randomized each session for UI realism.
            </div>
            <ChartContainer id="home-throughput-chart" config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={throughputData} margin={{ left: 8, right: 8, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  id="home-throughput-tooltip"
                  cursor={false}
                  content={<ChartTooltipContent id="home-throughput-tooltip-content" />}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-orders)"
                  fill="var(--color-orders)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card id="home-incidents-card" headerTitle="Incident Queue">
          <CardContent id="home-incidents-card-content" className="space-y-3">
            {openIncidents.map((incident) => (
              <div
                key={incident.id}
                className="rounded-xl border border-border/60 bg-card/40 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-foreground/90">{incident.id}</span>
                  <span className="text-xs text-muted-foreground">{incident.severity}</span>
                </div>
                <p className="mt-2 text-sm">{incident.service}</p>
                <p className="mt-1 text-xs text-muted-foreground">{incident.owner}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mb-5 grid gap-5 md:grid-cols-3">
        <Card id="home-placeholder-procurement" headerTitle="Procurement Planner">
          <CardContent id="home-placeholder-procurement-content" className="space-y-2">
            <p className="text-sm">Demand anomaly model refreshed and ready for review.</p>
            <p className="text-xs text-muted-foreground">Placeholder card for next sprint automation.</p>
          </CardContent>
        </Card>
        <Card id="home-placeholder-labor" headerTitle="Labor Coverage">
          <CardContent id="home-placeholder-labor-content" className="space-y-2">
            <p className="text-sm">Kitchen staffing risk is low across all active locations.</p>
            <p className="text-xs text-muted-foreground">Placeholder card for shift allocator module.</p>
          </CardContent>
        </Card>
        <Card id="home-placeholder-compliance" headerTitle="Compliance Watch">
          <CardContent id="home-placeholder-compliance-content" className="space-y-2">
            <p className="text-sm">All critical controls passing; one advisory requires follow-up.</p>
            <p className="text-xs text-muted-foreground">Placeholder card for policy engine integration.</p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Activity Feed</h2>
          <p className="text-sm text-muted-foreground">
            Latest events across ingest, catalog, and planning systems.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
          <Table id="home-activity-table">
            <TableHeader id="home-activity-table-header" className="bg-muted/20">
              <TableRow id="home-activity-table-header-row">
                <TableHead id="home-activity-head-system" className="text-xs uppercase tracking-wide">
                  System
                </TableHead>
                <TableHead id="home-activity-head-event" className="text-xs uppercase tracking-wide">
                  Event
                </TableHead>
                <TableHead id="home-activity-head-actor" className="text-xs uppercase tracking-wide">
                  Actor
                </TableHead>
                <TableHead
                  id="home-activity-head-status"
                  className="text-xs uppercase tracking-wide"
                >
                  Status
                </TableHead>
                <TableHead
                  id="home-activity-head-age"
                  className="text-right text-xs uppercase tracking-wide"
                >
                  Age
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody id="home-activity-table-body">
              {recentEvents.map((event, index) => (
                <TableRow key={`${event.system}-${index}`} id={`home-activity-row-${index}`}>
                  <TableCell id={`home-activity-system-${index}`} className="font-medium">
                    {event.system}
                  </TableCell>
                  <TableCell id={`home-activity-event-${index}`}>{event.event}</TableCell>
                  <TableCell
                    id={`home-activity-actor-${index}`}
                    className="font-mono text-xs text-foreground/90"
                  >
                    {event.actor}
                  </TableCell>
                  <TableCell id={`home-activity-status-${index}`}>
                    <span
                      className={
                        event.status === "Healthy"
                          ? "text-emerald-300"
                          : event.status === "Watching"
                            ? "text-amber-300"
                            : "text-red-300"
                      }
                    >
                      {event.status}
                    </span>
                  </TableCell>
                  <TableCell id={`home-activity-age-${index}`} className="text-right font-mono text-xs">
                    {event.age}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
