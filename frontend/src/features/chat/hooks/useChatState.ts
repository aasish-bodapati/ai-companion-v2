import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMessages, useSendMessage, useConversation, useUpdateConversation, useReply } from '@/features/conversations';
import { toast } from 'sonner';

export interface ChatState {
  // Core state
  input: string;
  setInput: (value: string) => void;
  liveAssistant: string;
  setLiveAssistant: (value: string) => void;
  liveFadeOut: boolean;
  setLiveFadeOut: (value: boolean) => void;
  liveProvenance: any[];
  setLiveProvenance: (value: any[]) => void;
  
  // UI state
  atBottom: boolean;
  setAtBottom: (value: boolean) => void;
  remember: boolean;
  setRemember: (value: boolean) => void;
  analyzeImages: boolean;
  setAnalyzeImages: (value: boolean) => void;
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  streamBufferRef: React.MutableRefObject<string>;
  liveAssistantRef: React.MutableRefObject<string>;
  liveAssistantRawRef: React.MutableRefObject<string>;
  fenceBufferRef: React.MutableRefObject<string>;
  sendStartedAtRef: React.MutableRefObject<number>;
  awaitingPersistRef: React.MutableRefObject<boolean>;
  persistFallbackTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  finalExpectedRef: React.MutableRefObject<string>;
  
  // Computed values
  conversationId: string | null;
  
  // API hooks
  conversation: any;
  messages: any[];
  isLoading: boolean;
  sendMessage: any;
  isSending: boolean;
  isReplyPending: boolean;
  regenerate: any;
  isRegenerating: boolean;
  updateConversation: any;
  isUpdating: boolean;
}

export function useChatState(): ChatState {
  const params = useParams();
  const conversationId = (params?.id as string | undefined) ?? null;
  
  // API hooks
  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: isSending, isReplyPending } = useSendMessage(conversationId || '');
  const { mutate: regenerate, isPending: isRegenerating } = useReply(conversationId || '');
  const { mutate: updateConversation, isPending: isUpdating } = useUpdateConversation();
  
  // Core state
  const [input, setInput] = useState<string>('');
  const [liveAssistant, setLiveAssistant] = useState<string>('');
  const [liveFadeOut, setLiveFadeOut] = useState<boolean>(false);
  const [liveProvenance, setLiveProvenance] = useState<any[]>([]);
  
  // UI state
  const [atBottom, setAtBottom] = useState<boolean>(true);
  const [remember, setRemember] = useState<boolean>(false);
  const [analyzeImages, setAnalyzeImages] = useState<boolean>(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamBufferRef = useRef<string>('');
  const liveAssistantRef = useRef<string>('');
  const liveAssistantRawRef = useRef<string>('');
  const fenceBufferRef = useRef<string>('');
  const sendStartedAtRef = useRef<number>(0);
  const awaitingPersistRef = useRef<boolean>(false);
  const persistFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalExpectedRef = useRef<string>('');
  
  return {
    // Core state
    input,
    setInput,
    liveAssistant,
    setLiveAssistant,
    liveFadeOut,
    setLiveFadeOut,
    liveProvenance,
    setLiveProvenance,
    
    // UI state
    atBottom,
    setAtBottom,
    remember,
    setRemember,
    analyzeImages,
    setAnalyzeImages,
    
    // Refs
    messagesEndRef,
    inputRef,
    fileInputRef,
    streamBufferRef,
    liveAssistantRef,
    liveAssistantRawRef,
    fenceBufferRef,
    sendStartedAtRef,
    awaitingPersistRef,
    persistFallbackTimerRef,
    finalExpectedRef,
    
    // Computed values
    conversationId,
    
    // API hooks
    conversation,
    messages,
    isLoading,
    sendMessage,
    isSending,
    isReplyPending,
    regenerate,
    isRegenerating,
    updateConversation,
    isUpdating,
  };
}
