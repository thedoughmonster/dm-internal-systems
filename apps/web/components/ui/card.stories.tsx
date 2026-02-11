import type { Meta, StoryObj } from "@storybook/nextjs"

import { Badge } from "./badge"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardTitleBar } from "./card"

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    id: "sb-card-default",
    headerTitle: "Service status",
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

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
