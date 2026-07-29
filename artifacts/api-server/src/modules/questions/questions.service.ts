import type { FastifyInstance } from "fastify";
import * as questionsRepo from "./questions.repository";
import type {
  PaginationQuery,
  CreateMcqQuestionBody,
  CreateCodingQuestionBody,
  UpdateQuestionBody,
  GenerateAiQuestionsBody,
} from "./questions.schemas";
import { HttpError } from "../../shared/errors/http-error";

export async function listQuestions(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  return questionsRepo.findQuestions(app, query);
}

export async function getQuestionById(app: FastifyInstance, id: string) {
  const question = await questionsRepo.findQuestionById(app, id);
  if (!question) {
    throw new HttpError(404, "Question not found");
  }
  return formatQuestion(question);
}

export async function createMcqQuestion(
  app: FastifyInstance,
  data: CreateMcqQuestionBody,
  createdByUserId: string,
) {
  if (data.correctOptionIndex >= data.options.length) {
    throw new HttpError(
      400,
      "correctOptionIndex must be less than the number of options",
    );
  }

  const question = await questionsRepo.createMcqQuestion(
    app,
    data,
    createdByUserId,
  );
  return formatQuestion(question);
}

export async function createCodingQuestion(
  app: FastifyInstance,
  data: CreateCodingQuestionBody,
  createdByUserId: string,
) {
  const question = await questionsRepo.createCodingQuestion(
    app,
    data,
    createdByUserId,
  );
  return formatQuestion(question);
}

export async function updateQuestion(
  app: FastifyInstance,
  id: string,
  data: UpdateQuestionBody,
) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  const question = await questionsRepo.updateQuestion(app, id, data);
  return formatQuestion(question);
}

export async function updateQuestionStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  const question = await questionsRepo.updateQuestionStatus(app, id, status);
  return formatQuestion(question);
}

export async function deleteQuestion(app: FastifyInstance, id: string) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  await questionsRepo.deleteQuestion(app, id);
  return { message: "Question deleted successfully" };
}

export async function getQuestionUsage(app: FastifyInstance, id: string) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  const usage = await questionsRepo.getQuestionUsage(app, id);
  return {
    questionId: id,
    usedInExams: usage.map(
      (u: {
        exam: { id: string; title: string; status: string };
        sequenceNo: number;
        marksOverride: number | null;
      }) => ({
        examId: u.exam.id,
        examTitle: u.exam.title,
        examStatus: u.exam.status,
        sequenceNo: u.sequenceNo,
        marksOverride: u.marksOverride,
      }),
    ),
    totalUsage: usage.length,
  };
}

export async function generateAiQuestions(data: GenerateAiQuestionsBody) {
  const { topic, difficulty, type, count } = data;
  
  const systemPrompt = `You are an expert exam question generator. 
Generate ${count} ${type === "MCQ" ? "multiple choice" : "coding"} question(s) about "${topic}" at difficulty level ${difficulty} out of 5.
Return ONLY a valid JSON object containing a "questions" array.
CRITICAL: Ensure your JSON is perfectly formatted. Do not forget colons after property names (e.g., use "prompt": "..." instead of "prompt " ...).

${type === "MCQ" ? `
The JSON object must have exactly this structure:
{
  "questions": [
    {
      "title": "Short title",
      "prompt": "The question text",
      "explanation": "General explanation (optional)",
      "difficulty": ${difficulty},
      "marks": 5,
      "options": [
        { "text": "Option A" },
        { "text": "Option B" },
        { "text": "Option C" },
        { "text": "Option D" }
      ],
      "correctOptionIndex": 0,
      "answerExplanation": "Why this is correct"
    }
  ]
}
` : `
The JSON object must have exactly this structure:
{
  "questions": [
    {
      "title": "Short title",
      "prompt": "The question text",
      "explanation": "General explanation",
      "difficulty": ${difficulty},
      "marks": 10,
      "starterCode": "function solve() {}",
      "sampleInput": "2 3",
      "sampleOutput": "5",
      "testCases": [
        { "input": "2 3", "expectedOutput": "5", "isHidden": false },
        { "input": "4 5", "expectedOutput": "9", "isHidden": true }
      ]
    }
  ]
}
`}
`;

  try {
    const apiUrl = process.env.LLM_API_URL || "https://openrouter.ai/api/v1/chat/completions";
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please generate the ${count} questions now based on the system instructions.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API returned ${response.status}`);
    }

    const result = (await response.json()) as any;
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content generated");
    }

    // Try to parse JSON out of the response (sometimes it's wrapped in backticks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON object from LLM response");
    }

    let jsonStr = jsonMatch[0];
    
    // Fix common missing colon hallucination from some local models (e.g., "prompt "You" -> "prompt": "You")
    jsonStr = jsonStr.replace(/"([^"]+)"\s+"/g, '"$1": "');

    const parsed = JSON.parse(jsonStr);
    return parsed.questions || [];
  } catch (error: any) {
    throw new HttpError(500, `Failed to generate AI questions: ${error.message}`);
  }
}

type QuestionWithSubtype = {
  id: string;
  departmentId: string;
  createdByUserId: string | null;
  type: string;
  status: string;
  title: string;
  prompt: string;
  explanation: string | null;
  difficulty: number;
  marks: number;
  timeLimitSeconds: number | null;
  tags: unknown;
  createdAt: Date;
  updatedAt: Date;
  mcq: {
    options: unknown;
    correctOptionIndex: number;
    shuffleOptions: boolean;
    answerExplanation: string | null;
  } | null;
  coding: {
    starterCode: string | null;
    solutionTemplate: string | null;
    testCases: unknown;
    languageConstraints: unknown;
    sampleInput: string | null;
    sampleOutput: string | null;
  } | null;
};

function formatQuestion(q: QuestionWithSubtype) {
  return {
    id: q.id,
    departmentId: q.departmentId,
    createdByUserId: q.createdByUserId,
    type: q.type,
    status: q.status,
    title: q.title,
    prompt: q.prompt,
    explanation: q.explanation,
    difficulty: q.difficulty,
    marks: q.marks,
    timeLimitSeconds: q.timeLimitSeconds,
    tags: q.tags,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    mcq: q.mcq
      ? {
          options: q.mcq.options as Array<{ text: string }>,
          correctOptionIndex: q.mcq.correctOptionIndex,
          shuffleOptions: q.mcq.shuffleOptions,
          answerExplanation: q.mcq.answerExplanation,
        }
      : null,
    coding: q.coding
      ? {
          starterCode: q.coding.starterCode,
          solutionTemplate: q.coding.solutionTemplate,
          testCases: q.coding.testCases as Array<{
            input: string;
            expectedOutput: string;
          }>,
          languageConstraints: q.coding.languageConstraints as string[] | null,
          sampleInput: q.coding.sampleInput,
          sampleOutput: q.coding.sampleOutput,
        }
      : null,
  };
}
