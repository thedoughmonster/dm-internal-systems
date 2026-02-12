import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground } from "@/lib/storybook/module-playground"
import { Badge } from "./badge"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardTitleBar } from "./card"
import * as ComponentModule from "./card"

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    id: "sb-card-default",
    headerTitle: "Service status",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Card is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Card in product routes. Validate heading hierarchy, content readability, and action affordances in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="Card" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Card" moduleExports={ComponentModule} />,
}

export const VisibleBaseline: Story = {
  render: () => (
    <Card
      id="sb-card-overview"
      headerTitle="Service status"
      headerBadges={[
        <Badge id="sb-card-overview-badge" key="status" variant="secondary">
          Active
        </Badge>,
      ]}
      headerMeta={["region: us-east-1", "updated: now"]}
      footerActions={[
        <Button id="sb-card-overview-action" key="inspect" size="sm" variant="outline">
          Inspect
        </Button>,
      ]}
    >
      <CardContent id="sb-card-overview-content" className="space-y-3">
        <CardTitleBar
          id="sb-card-overview-titlebar"
          title="Gateway API"
          siblingTitle="v2.9.1"
          subtitle="Latency within threshold"
        />
        <CardDescription id="sb-card-overview-description">
          Requests are stable. Error budget consumption is below warning level.
        </CardDescription>
      </CardContent>
    </Card>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="grid gap-3">
      <Card
        id="sb-card-variants-service"
        headerTitle="Service status"
        headerBadges={[
          <Badge id="sb-card-variants-service-badge" key="status" variant="secondary">
            Active
          </Badge>,
        ]}
      >
        <CardContent id="sb-card-variants-service-content" className="space-y-2">
          <CardTitleBar id="sb-card-variants-service-titlebar" title="Gateway API" />
          <CardDescription id="sb-card-variants-service-description">
            Stable service panel variant.
          </CardDescription>
        </CardContent>
      </Card>
      <Card
        id="sb-card-variants-alert"
        headerTitle="Alert details"
        headerBadges={[
          <Badge id="sb-card-variants-alert-badge" key="severity" variant="destructive">
            Critical
          </Badge>,
        ]}
      >
        <CardContent id="sb-card-variants-alert-content" className="space-y-2">
          <CardTitleBar id="sb-card-variants-alert-titlebar" title="Queue processing lag" />
          <CardDescription id="sb-card-variants-alert-description">
            Escalated alert panel variant.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  ),
}

export const ServicePanel: Story = {
  render: (args) => (
    <Card
      {...args}
      id="sb-card-service"
      headerTitle="Service status"
      headerBadges={[
        <Badge id="sb-card-service-badge" key="status" variant="secondary">
          Active
        </Badge>,
      ]}
      headerMeta={["region: us-east-1", "updated: now"]}
      footerActions={[
        <Button id="sb-card-service-action" key="inspect" size="sm" variant="outline">
          Inspect
        </Button>,
      ]}
    >
      <CardContent id="sb-card-service-content" className="space-y-3">
        <CardTitleBar
          id="sb-card-service-titlebar"
          title="Gateway API"
          siblingTitle="v2.9.1"
          subtitle="Latency within threshold"
        />
        <CardDescription id="sb-card-service-description">
          Requests are stable. Error budget consumption is below warning level.
        </CardDescription>
      </CardContent>
    </Card>
  ),
}

export const AlertPanel: Story = {
  render: () => (
    <Card
      id="sb-card-alert"
      headerTitle="Alert details"
      headerBadges={[
        <Badge id="sb-card-alert-badge" key="severity" variant="destructive">
          Critical
        </Badge>,
      ]}
      headerMeta={["source: watchdog", "state: open"]}
    >
      <CardContent id="sb-card-alert-content" className="space-y-3">
        <CardTitleBar
          id="sb-card-alert-titlebar"
          title="Queue processing lag"
          subtitle="Oldest message age is above target."
        />
        <CardDescription id="sb-card-alert-description">
          Escalation triggered. No footer actions provided to show empty-state fallback.
        </CardDescription>
      </CardContent>
    </Card>
  ),
}
