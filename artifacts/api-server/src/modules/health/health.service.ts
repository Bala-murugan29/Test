import type { FastifyInstance } from "fastify";
import { readHealthSnapshot } from "./health.repository";

export async function healthService(app: FastifyInstance) {
  return readHealthSnapshot(app);
}