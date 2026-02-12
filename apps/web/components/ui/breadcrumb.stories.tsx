import type { Meta, StoryObj } from "@storybook/nextjs"
import { Slash } from "lucide-react"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground } from "@/lib/storybook/module-playground"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"
import * as ComponentModule from "./breadcrumb"

const meta = {
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  args: {
    id: "sb-breadcrumb",
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          "Breadcrumb provides semantic path navigation for nested screens and records. Use it to show location context and support quick backtracking. Keep only the current page non-interactive and ensure truncation or collapse behavior is used for deep hierarchies.",
      },
      page: () => <ModuleDocsPage moduleName="Breadcrumb" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta<typeof Breadcrumb>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Breadcrumb" moduleExports={ComponentModule} />,
}

export const VisibleBaseline: Story = {
  render: () => (
    <Breadcrumb id="sb-breadcrumb-overview">
      <BreadcrumbList id="sb-breadcrumb-overview-list">
        <BreadcrumbItem id="sb-breadcrumb-overview-item-home">
          <BreadcrumbLink id="sb-breadcrumb-overview-link-home" href="#">
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-overview-sep-1" />
        <BreadcrumbItem id="sb-breadcrumb-overview-item-vendors">
          <BreadcrumbLink id="sb-breadcrumb-overview-link-vendors" href="#">
            Vendors
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-overview-sep-2" />
        <BreadcrumbItem id="sb-breadcrumb-overview-item-page">
          <BreadcrumbPage id="sb-breadcrumb-overview-page">Acme Supplies</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

export const DeepHierarchy: Story = {
  render: () => (
    <Breadcrumb id="sb-breadcrumb-deep">
      <BreadcrumbList id="sb-breadcrumb-deep-list">
        <BreadcrumbItem id="sb-breadcrumb-deep-item-home">
          <BreadcrumbLink id="sb-breadcrumb-deep-link-home" href="#">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-deep-sep-1" />
        <BreadcrumbItem id="sb-breadcrumb-deep-item-operations">
          <BreadcrumbLink id="sb-breadcrumb-deep-link-operations" href="#">
            Operations
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-deep-sep-2" />
        <BreadcrumbItem id="sb-breadcrumb-deep-item-vendor-ingest">
          <BreadcrumbLink id="sb-breadcrumb-deep-link-vendor-ingest" href="#">
            Vendor Ingest
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-deep-sep-3" />
        <BreadcrumbItem id="sb-breadcrumb-deep-item-sessions">
          <BreadcrumbLink id="sb-breadcrumb-deep-link-sessions" href="#">
            Sessions
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-deep-sep-4" />
        <BreadcrumbItem id="sb-breadcrumb-deep-item-page">
          <BreadcrumbPage id="sb-breadcrumb-deep-page">Session 2026-02-12</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

export const Collapsed: Story = {
  render: () => (
    <Breadcrumb id="sb-breadcrumb-collapsed">
      <BreadcrumbList id="sb-breadcrumb-collapsed-list">
        <BreadcrumbItem id="sb-breadcrumb-collapsed-item-home">
          <BreadcrumbLink id="sb-breadcrumb-collapsed-link-home" href="#">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-collapsed-sep-1" />
        <BreadcrumbItem id="sb-breadcrumb-collapsed-item-ellipsis">
          <BreadcrumbEllipsis id="sb-breadcrumb-collapsed-ellipsis" />
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-collapsed-sep-2" />
        <BreadcrumbItem id="sb-breadcrumb-collapsed-item-current">
          <BreadcrumbPage id="sb-breadcrumb-collapsed-page">Release Checklist</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb id="sb-breadcrumb-custom-separator">
      <BreadcrumbList id="sb-breadcrumb-custom-separator-list">
        <BreadcrumbItem id="sb-breadcrumb-custom-separator-item-home">
          <BreadcrumbLink id="sb-breadcrumb-custom-separator-link-home" href="#">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-custom-separator-sep-1">
          <Slash className="h-3.5 w-3.5" />
        </BreadcrumbSeparator>
        <BreadcrumbItem id="sb-breadcrumb-custom-separator-item-settings">
          <BreadcrumbLink id="sb-breadcrumb-custom-separator-link-settings" href="#">
            Settings
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator id="sb-breadcrumb-custom-separator-sep-2">
          <Slash className="h-3.5 w-3.5" />
        </BreadcrumbSeparator>
        <BreadcrumbItem id="sb-breadcrumb-custom-separator-item-page">
          <BreadcrumbPage id="sb-breadcrumb-custom-separator-page">Agent Rules</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}
