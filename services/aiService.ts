import api from "./api";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  message: string;
  projectId: string;
  fileId: string;
  currentFilePath?: string;
  selectedCode?: string;
  history?: ChatHistoryMessage[];
}
export interface AIChatResponse {
  reply: string;
}

export async function sendAIMessage(
  req: AIChatRequest
): Promise<AIChatResponse> {
  const res = await api.post<AIChatResponse>(
    "/ai/chat",
    req,
    { timeout: 60_000 } 
  );
  return res.data;
}