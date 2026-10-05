"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  MessageSquare,
  X,
  Plus,
  History,
  Trash2,
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import type { DashboardResponse } from "@/types/dashboard"
import {
  ChatMessage,
  ConversationSummary,
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
} from "@/types/chat"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatBotProps {
  pageId: string
  userId: string
  pageContent: DashboardResponse | null
}

const SUGGESTED_PROMPTS = [
  "Summarize our overall performance and reach.",
  "Which post performed best and why?",
  "What posting times give us maximum engagement?",
  "What are our main weaknesses and how to fix them?",
]

export function ChatBot({ pageId, userId, pageContent }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_GEMINI_MODEL)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  // Conversations & Messages State
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [activeTitle, setActiveTitle] = useState<string>("New Conversation")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Input & Send State
  const [inputQuery, setInputQuery] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isSending])

  // Close model dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Lazy-load conversations list
  const fetchConversations = useCallback(async () => {
    if (!pageId) return
    setLoadingHistory(true)
    setErrorMsg(null)
    try {
      const url = `/api/pages/${pageId}/conversations${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Failed to load conversations")
      }
      const data = await res.json()
      setConversations(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading history"
      setErrorMsg(msg)
    } finally {
      setLoadingHistory(false)
    }
  }, [pageId, userId])

  // Fetch messages for a specific conversation
  const loadConversationMessages = async (convId: string, title?: string) => {
    setActiveConversationId(convId)
    if (title) setActiveTitle(title)
    setShowHistory(false)
    setLoadingMessages(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/pages/${pageId}/conversations/${convId}/messages`)
      if (!res.ok) {
        throw new Error("Failed to load conversation messages")
      }
      const data = await res.json()
      setMessages(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading messages"
      setErrorMsg(msg)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Create new conversation
  const handleStartNewConversation = () => {
    setActiveConversationId(null)
    setActiveTitle("New Conversation")
    setMessages([])
    setErrorMsg(null)
    setShowHistory(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Toggle history drawer
  const handleToggleHistory = () => {
    if (!showHistory) {
      fetchConversations()
    }
    setShowHistory(!showHistory)
  }

  // Delete active conversation
  const handleDeleteConversation = async (convIdToDelete?: string) => {
    const targetId = convIdToDelete || activeConversationId
    if (!targetId) return

    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return
    }

    setIsDeleting(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/pages/${pageId}/conversations/${targetId}`, {
        method: "DELETE",
      })
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete conversation")
      }

      setConversations((prev) => prev.filter((c) => c.id !== targetId))
      if (activeConversationId === targetId) {
        handleStartNewConversation()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete"
      setErrorMsg(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Send message
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : inputQuery).trim()
    if (!textToSend || isSending) return

    if (!pageContent) {
      setErrorMsg("Dashboard data is still loading. Please wait a moment.")
      return
    }

    setErrorMsg(null)
    setInputQuery("")

    // Optimistically show user query in message list
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_query: textToSend,
      llm_response: "",
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setIsSending(true)

    try {
      const res = await fetch(`/api/pages/${pageId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          page_id: pageId,
          conversation_id: activeConversationId,
          user_query: textToSend,
          page_content: pageContent,
          model: selectedModel,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      // Update active conversation ID and title if newly created
      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id)
        setActiveTitle(data.title || "Conversation")
      }

      // Replace optimistic message with actual completed response
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempUserMsg.id
            ? {
                id: `msg-${Date.now()}`,
                user_query: data.user_query,
                llm_response: data.llm_response,
                created_at: new Date().toISOString(),
              }
            : m
        )
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending message"
      setErrorMsg(msg)
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
      setInputQuery(textToSend)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const activeModelObj =
    GEMINI_MODELS.find((m) => m.key === selectedModel) || GEMINI_MODELS[0]

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button (Bottom-Right) */}
      {!isOpen && (
        <button
          id="chatbot-floating-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Page Assistant"
          className="group relative flex items-center gap-3 px-4 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 backdrop-blur-md cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Ask Page AI</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 font-medium">
            {activeModelObj.name.replace("Gemini ", "")}
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          id="chatbot-panel"
          className="w-[92vw] sm:w-[460px] h-[640px] max-h-[85vh] rounded-3xl bg-slate-900/95 border border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Top Header Bar */}
          <div className="px-4 py-3.5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
            {/* Title & Status */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate max-w-[170px] sm:max-w-[210px]">
                    {activeTitle}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Page Analytics Chatbot
                </p>
              </div>
            </div>

            {/* Action Icons in Header: [+] [History] [Delete] [Close] */}
            <div className="flex items-center gap-1 shrink-0">
              {/* + Icon: Create New Conversation */}
              <button
                id="chatbot-new-conv-btn"
                onClick={handleStartNewConversation}
                title="New Conversation"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="New Conversation"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* History Icon: Toggle History Drawer */}
              <button
                id="chatbot-history-btn"
                onClick={handleToggleHistory}
                title="Conversation History"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showHistory
                    ? "bg-blue-600/30 text-blue-400 border border-blue-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                aria-label="Chat History"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Delete Icon: Delete Current Conversation */}
              <button
                id="chatbot-delete-btn"
                onClick={() => handleDeleteConversation()}
                disabled={!activeConversationId || isDeleting}
                title={
                  activeConversationId
                    ? "Delete Current Conversation"
                    : "No active conversation to delete"
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label="Delete Current Conversation"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

              {/* Close Button */}
              <button
                id="chatbot-close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Drawer Overlay */}
          {showHistory && (
            <div className="absolute inset-x-0 top-[60px] bottom-[72px] z-20 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 flex flex-col animate-in fade-in duration-200">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Past Conversations
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Back to Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-xs">Loading conversations...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400 space-y-2">
                    <History className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">No conversation history</p>
                    <p className="text-xs text-slate-500">
                      Conversations you have on this page will appear here.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId
                    return (
                      <div
                        key={conv.id}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600/15 border-blue-500/40 text-blue-100"
                            : "bg-slate-900/60 border-white/5 hover:border-white/15 text-slate-300 hover:text-white"
                        }`}
                        onClick={() => loadConversationMessages(conv.id, conv.title)}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-medium truncate">{conv.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(conv.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteConversation(conv.id)
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Main Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {/* Error Notification */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">{errorMsg}</div>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-400 hover:text-rose-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Loading Conversation Messages */}
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Retrieving conversation...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Empty State with Suggestions */
              <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8 space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-blue-400 shadow-inner">
                  <Bot className="w-7 h-7" />
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-base font-semibold text-white">
                    Ask about {pageContent?.page.name || "this Page"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ask specific questions about reach, top posts, engagement trends, and strategic advice.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2 text-left">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">
                    Suggested Questions
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-xs text-slate-300 hover:text-white p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 transition-all flex items-center justify-between group text-left cursor-pointer"
                      >
                        <span className="truncate pr-2">{prompt}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message List */
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Query */}
                  <div className="flex items-start justify-end gap-2">
                    <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 text-white shadow-md text-sm leading-relaxed break-words">
                      {msg.user_query}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Assistant Response */}
                  <div className="flex items-start justify-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/20 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/10 px-3.5 py-2.5 text-slate-200 shadow-md text-xs sm:text-sm leading-relaxed break-words">
                      {msg.llm_response ? (
                        <div className="markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-white">{children}</strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-slate-300">{children}</em>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-4 mb-2 space-y-1 last:mb-0">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-4 mb-2 space-y-1 last:mb-0">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed pl-0.5">{children}</li>
                              ),
                              code({ className, children, ...props }) {
                                const isBlock = /language-(\w+)/.test(className || "") || String(children).includes("\n")
                                if (isBlock) {
                                  return (
                                    <pre className="p-3 my-2 rounded-xl bg-slate-950/90 border border-white/10 overflow-x-auto text-xs text-slate-200 font-mono">
                                      <code>{children}</code>
                                    </pre>
                                  )
                                }
                                return (
                                  <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-indigo-300 font-mono text-xs">
                                    {children}
                                  </code>
                                )
                              },
                              h1: ({ children }) => (
                                <h1 className="text-base font-bold text-white mb-2 mt-1">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-sm font-bold text-white mb-1.5 mt-1">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-xs font-bold text-white mb-1 mt-0.5">{children}</h3>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-indigo-400 pl-3 my-2 italic text-slate-400">
                                  {children}
                                </blockquote>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-2">
                                  <table className="w-full text-xs border border-white/10 rounded-lg">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="p-1.5 bg-slate-900/90 font-semibold border-b border-white/10 text-left text-white">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="p-1.5 border-b border-white/5 text-slate-300">
                                  {children}
                                </td>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline hover:text-blue-300"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {msg.llm_response}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 py-1">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                          <span className="text-xs">Analyzing telemetry...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Area: Model Selector + Textarea + Send Button */}
          <div className="p-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-md space-y-2.5 shrink-0">
            {/* Model Selector Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="chatbot-model-select-btn"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/90 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">{activeModelObj.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Model Dropdown Menu */}
                {isModelDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-slate-900 border border-white/15 p-1 shadow-2xl backdrop-blur-2xl z-30 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Select Gemini Model
                    </div>
                    {GEMINI_MODELS.map((model) => (
                      <button
                        key={model.key}
                        onClick={() => {
                          setSelectedModel(model.key)
                          setIsModelDropdownOpen(false)
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                          selectedModel === model.key
                            ? "bg-blue-600/20 border border-blue-500/40 text-blue-200"
                            : "hover:bg-white/5 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{model.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                            {model.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {model.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500">
                Shift + Enter for new line
              </span>
            </div>

            {/* Input & Send Form */}
            <div className="flex items-end gap-2 bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
              <textarea
                ref={textareaRef}
                id="chatbot-query-input"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this page..."
                rows={1}
                disabled={isSending}
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none max-h-24 min-h-[34px] leading-relaxed"
              />

              <button
                id="chatbot-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isSending}
                className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-blue-600 disabled:hover:to-indigo-600 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send Message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
