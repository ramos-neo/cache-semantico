import { Hono } from "hono";
import { getDbStatus } from "../db/index.js";

export const dbRoutes = new Hono();

dbRoutes.get("/db/status", async (c) => {
  return c.json(await getDbStatus());
});
