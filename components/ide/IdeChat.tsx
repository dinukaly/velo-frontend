"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  User,
  Loader2,
  Code2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendAIMessage } from "@/services/aiService";
import { toast } from "sonner";
// Types
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}
export interface IdeAiChatProps {
  projectId: string;
  currentFilePath: string | null;
  selectedCode?: string;
  onClose: () => void;
}
//Helpers
function uid() {
  return Math.random().toString(36).slice(2);
}
/**
 * Very lightweight markdown renderer:
 * - ```...``` → <pre><code>
 * - `...`     → <code>
 * - **...**   → <strong>
 * - newlines  → <br>
 */
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  // Split on triple-backtick blocks
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // text before the block
    if (match.index > lastIndex) {
      parts.push(
        <InlineMarkdown key={lastIndex} text={text.slice(lastIndex, match.index)} />
      );
    }
    parts.push(
      <pre
        key={match.index}
        className="my-2 overflow-x-auto rounded-md bg-black/40 border border-white/10 p-3 text-[11px] font-mono text-green-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
      >
        <code>{match[1].trimEnd()}</code>
      </pre>
    );
    lastIndex = match.index + match[0].length;
  }
  // Remaining text
  if (lastIndex < text.length) {
    parts.push(<InlineMarkdown key={lastIndex} text={text.slice(lastIndex)} />);
  }
  return <>{parts}</>;
}
function InlineMarkdown({ text }: { text: string }) {
  // inline code + bold
  const rendered = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 text-[11px] font-mono text-amber-300">$1</code>')
    .replace(/\n/g, "<br/>");
  return (
    <span
      className="leading-relaxed"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
// Message Bubble 
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={cn(
        "flex gap-2.5 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-violet-500/20 text-violet-400"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
          isUser
            ? "bg-primary/15 text-foreground border border-primary/20"
            : msg.isError
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-white/5 text-foreground border border-white/10"
        )}
      >
        {isUser ? (
          <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
        ) : (
          renderMarkdown(msg.content)
        )}
        <div
          className={cn(
            "mt-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "text-right text-primary/50" : "text-muted-foreground/50"
          )}
        >
          {msg.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
// Thinking Indicator 
function ThinkingBubble() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
// Main Component
export function IdeAiChat({
  projectId,
  currentFilePath,
  selectedCode,
  onClose,
}: IdeAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi! I'm **Velo AI** ✨\n\nI can see your active file and any code you select in the editor. Ask me anything — explain code, debug errors, suggest improvements, or generate snippets.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);
  // Show scroll-to-bottom button when scrolled up
  function handleScroll() {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  }
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    try {
      const res = await sendAIMessage({
        message: trimmed,
        projectId,
        currentFilePath: currentFilePath ?? "unknown",
        selectedCode: selectedCode ?? undefined,
      });
      const aiMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: res.reply ?? "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      console.error("[AI Chat] Error:", err);
      const errMsg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error("AI request failed");
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }
  function handleClearChat() {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content:
          "Chat cleared. How can I help you with your code?",
        timestamp: new Date(),
      },
    ]);
  }
  return (
    <div className="flex h-full flex-col bg-[#0d0d0f] border-l border-white/[0.08]">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.08] px-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/20 text-violet-400">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground">Velo AI</span>
          {/* Active file pill */}
          {currentFilePath && (
            <span className="hidden sm:flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground border border-white/[0.06] truncate max-w-[140px]">
              <Code2 className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{currentFilePath.split("/").pop()}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Clear conversation"
            onClick={handleClearChat}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Close AI chat"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Selected code badge */}
      {selectedCode && (
        <div className="shrink-0 flex items-center gap-1.5 mx-3 mt-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[10px] text-amber-400">
          <Code2 className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {selectedCode.split("\n").length} lines selected — I can see your selection
          </span>
        </div>
      )}
      {/* Messages */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isLoading && <ThinkingBubble />}
        <div ref={messagesEndRef} />
      </div>
      {/* Scroll-to-bottom floating button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground shadow-lg transition-all"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.08] p-2.5">
        <div className="flex items-end gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 focus-within:border-violet-500/40 transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Velo AI… (Shift+Enter for new line)"
            className="min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin scrollbar-thumb-white/10"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className={cn(
              "h-7 w-7 shrink-0 rounded-lg transition-colors",
              input.trim() && !isLoading
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : "bg-white/[0.04] text-muted-foreground cursor-not-allowed"
            )}
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
            title="Send (Enter)"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground/40 text-center">
          AI can make mistakes — always review generated code.
        </p>
      </div>
    </div>
  );
}