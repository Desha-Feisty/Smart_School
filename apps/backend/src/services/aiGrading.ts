import { GoogleGenerativeAI } from "@google/generative-ai";

interface GradingInput {
    questionPrompt: string;
    studentAnswer: string;
    sampleAnswer?: string;
    rubric?: string;
    maxPoints: number;
}

interface GradingOutput {
    score: number;
    feedback: string;
}

export async function gradeWrittenAnswer(input: GradingInput): Promise<GradingOutput> {
    const { questionPrompt, studentAnswer, sampleAnswer, rubric, maxPoints } = input;

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("AI features are not configured on the server");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let gradingCriteria = "";
    if (sampleAnswer) {
        gradingCriteria += `A sample ideal answer is provided:\n"${sampleAnswer}"\n\n`;
    }
    if (rubric) {
        gradingCriteria += `Use the following rubric for grading:\n"${rubric}"\n\n`;
    }
    gradingCriteria += `The maximum points for this question is ${maxPoints}.`;

    const prompt = `You are an expert educator grading a student's written answer.

Question: "${questionPrompt}"

${gradingCriteria}

Student's Answer:
"${studentAnswer}"

Please provide a JSON response with the following structure:
{
    "score": <number between 0 and ${maxPoints}>,
    "feedback": "<detailed feedback explaining the score, highlighting strengths and areas for improvement>"
}

Be fair and constructive in your feedback. Consider:
- Accuracy of the answer
- Completeness of the response
- Understanding of the concepts
- Clarity of expression

Return ONLY valid JSON, no markdown formatting.`;

    try {
        let result;
        let lastError;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                result = await model.generateContent(prompt);
                break;
            } catch (err) {
                lastError = err;
                if (attempt < 2) {
                    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                }
            }
        }
        if (!result) throw lastError;
        const text = result.response.text().trim();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI returned invalid format");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and clamp score
        const score = Math.max(0, Math.min(maxPoints, Number(parsed.score) || 0));

        return {
            score,
            feedback: parsed.feedback || "No feedback provided.",
        };
    } catch (error) {
        console.error("AI grading error:", error);
        throw new Error("Failed to grade answer with AI");
    }
}