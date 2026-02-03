import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "../../app");

const isRouteGroup = (name) => name.startsWith("(") && name.endsWith(")");

const getTopLevelRoutes = (dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const routes = new Set();
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === "api") {
      continue;
    }

    if (isRouteGroup(entry.name)) {
      const nested = getTopLevelRoutes(path.join(dir, entry.name));
      for (const route of nested) {
        routes.add(route);
      }
      continue;
    }

    routes.add(entry.name);
  }

  return Array.from(routes).sort();
};

const routes = getTopLevelRoutes(appDir);

export const routeBoundaryZones = routes.flatMap((targetRoute) =>
  routes
    .filter((fromRoute) => fromRoute !== targetRoute)
    .map((fromRoute) => ({
      target: `./app/${targetRoute}/**`,
      from: `./app/${fromRoute}/**`,
      message:
        "Do not import from other route trees. Use shared modules in @/lib or shared UI components.",
    }))
);
