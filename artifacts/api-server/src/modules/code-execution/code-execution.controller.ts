import type { FastifyReply, FastifyRequest } from "fastify";
import { runCode } from "./code-execution.service";
import { codeRunResponseSchema } from "./code-execution.schemas";
import { HttpError } from "../../shared/errors/http-error";

export async function runCodeController(
  request: FastifyRequest<{
    Body: {
      language: string;
      sourceCode: string;
      stdin?: string;
      testCases?: Array<{ input: string; expectedOutput: string }>;
    };
  }>,
  reply: FastifyReply,
) {
  const userId = (request.user as { sub: string } | undefined)?.sub;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const result = await runCode(request.server, userId, request.body);
  return reply.code(200).send(codeRunResponseSchema.parse(result));
}
