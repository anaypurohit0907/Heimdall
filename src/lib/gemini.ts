import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type GeminiPodRanking = {
  reasoning_trace: string;
  rankings: {
    candidate_id: string;
    rank: number; // 1-4
    justification: string;
  }[];
};

type PodCandidate = {
  id: string;
  name: string;
  rawText: string;
};

export async function evaluatePod(
  jdText: string,
  candidates: PodCandidate[],
): Promise<GeminiPodRanking> {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);

  const candidatesBlock = shuffled
    .map(
      (c, i) =>
        `--- CANDIDATE ${String.fromCharCode(65 + i)} ---\nName: ${c.name}\nID: ${c.id}\nProfile:\n${c.rawText.trim()}`,
    )
    .join("\n\n");

  const prompt = `
ROLE: You are an elite technical hiring committee with decades of experience evaluating top engineering talent.

TASK: Evaluate the following 4 candidates against the provided Job Description. You must strictly rank them 1 to 4, where 1 is the best fit. No ties allowed.

IMPORTANT: Ignore the order in which candidates are presented. The letters (A, B, C, D) are arbitrary labels — evaluate based on substance only.

First, produce a detailed step-by-step reasoning trace analyzing each candidate's strengths and weaknesses relative to the JD. Then, produce the final ranking.

JOB DESCRIPTION:
${jdText.trim()}

CANDIDATES:
${candidatesBlock}
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction:
        "You are an elite technical hiring committee. Objective: Evaluate 4 candidates against the provided Job Description. You must strictly rank them 1 to 4. Style: Analytical, unbiased, and highly critical. Tone: Professional, objective. Audience: The internal HR engineering system. Response: Strictly JSON, containing the reasoning_trace followed by the ranked list. Ignore the order candidates are presented to avoid position bias.",
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          reasoning_trace: {
            type: "string",
            description:
              "Step-by-step evaluation of all 4 candidates against the JD. Analyze strengths, weaknesses, and compare them to each other.",
          },
          rankings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                candidate_id: {
                  type: "string",
                  description: "The exact ID of the candidate as provided",
                },
                rank: {
                  type: "integer",
                  description: "Rank from 1 (best) to 4 (worst)",
                },
                justification: {
                  type: "string",
                  description:
                    "One sentence explaining why this candidate earned this rank",
                },
              },
              required: ["candidate_id", "rank", "justification"],
            },
          },
        },
        required: ["reasoning_trace", "rankings"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  const result = JSON.parse(text) as GeminiPodRanking;
  return result;
}
