'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatTime, formatDate, getProviderProfileUrl } from '@/lib/utils';
import type { MessageWithSender, Profile, ConversationStatus, ConversationCloseReason } from '@/types/database';

// System user ID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface ChatWindowProps {
  messages: MessageWithSender[];
  currentUserId: string;
  otherUser: Profile;
  conversationId: string;
  onSendMessage: (body: string) => Promise<void>;
  // Conversation lifecycle props
  conversationStatus?: ConversationStatus;
  closedAt?: string | null;
  isSeeker?: boolean; // true if current user is the seeker (client)
  providerId?: string;
  onClose?: (reason?: ConversationCloseReason) => Promise<void>;
  onReopen?: () => Promise<void>;
  // If there's already an active conversation with this provider
  activeConversationId?: string | null;
}

// System avatar component
function SystemAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </div>
  );
}

// Render message content with basic markdown support (bold)
function renderMessageContent(content: string): React.ReactNode {
  // Split by **text** pattern to render bold text
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** and render as bold
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-semibold">{boldText}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

// Close reason options
const CLOSE_REASONS: { value: ConversationCloseReason; labelKey: string }[] = [
  { value: 'success', labelKey: 'closeReasons.success' },
  { value: 'cancelled', labelKey: 'closeReasons.cancelled' },
  { value: 'not_actual', labelKey: 'closeReasons.notActual' },
  { value: 'no_result', labelKey: 'closeReasons.noResult' },
  { value: 'other', labelKey: 'closeReasons.other' },
];

export function ChatWindow({
  messages,
  currentUserId,
  otherUser,
  conversationId,
  onSendMessage,
  conversationStatus = 'active',
  closedAt,
  isSeeker = false,
  providerId,
  onClose,
  onReopen,
  activeConversationId,
}: ChatWindowProps) {
  const t = useTranslations('messages');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ConversationCloseReason | ''>('');
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isSystemConversation = otherUser?.id === SYSTEM_USER_ID;
  const isClosed = conversationStatus === 'closed';
  
  // Check if can reopen (within 14 days of closing AND no active conversation exists)
  const canReopen = isClosed && closedAt && isSeeker && !activeConversationId && (() => {
    const closedDate = new Date(closedAt);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return closedDate >= fourteenDaysAgo;
  })();
  
  // Show "Go to active" button when closed AND there's another active conversation
  const showGoToActive = isClosed && isSeeker && activeConversationId;
  
  const canClose = !isClosed && isSeeker && !isSystemConversation;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || isClosed) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!onClose || isClosing) return;
    setIsClosing(true);
    try {
      await onClose(selectedReason || undefined);
      setShowCloseModal(false);
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopen = async () => {
    if (!onReopen || isReopening) return;
    setIsReopening(true);
    try {
      await onReopen();
    } finally {
      setIsReopening(false);
    }
  };

  // Group messages by date
  const messagesByDate = messages.reduce(
    (groups, message) => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, MessageWithSender[]>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-200 ${isSystemConversation ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}`}>
        {isSystemConversation ? (
          <SystemAvatar size="md" />
        ) : (
          <Avatar src={otherUser?.avatar_url} alt={otherUser?.display_name || 'User'} size="md" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {isSystemConversation ? 'Localisio System' : otherUser?.display_name}
            </h2>
            {isSystemConversation && (
              <Badge variant="info" size="sm">System</Badge>
            )}
            {isClosed && (
              <Badge variant="default" size="sm">{t('status.closed')}</Badge>
            )}
          </div>
          {isSystemConversation && (
            <p className="text-sm text-gray-500">Official announcements and notifications</p>
          )}
        </div>
        {/* Action buttons */}
        {!isSystemConversation && (
          <div className="flex items-center gap-2">
            {canClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloseModal(true)}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('markResolved')}
              </Button>
            )}
            {showGoToActive && (
              <Link href={`/dashboard/messages/${activeConversationId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t('goToActiveConversation')}
                </Button>
              </Link>
            )}
            {canReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReopen}
                isLoading={isReopening}
              >
                {t('reopenRequest')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">{t('closeModal.title')}</h3>
            <p className="text-gray-600 mb-4">{t('closeModal.description')}</p>
            
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700">{t('closeModal.reason')}</label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value as ConversationCloseReason | '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('closeModal.noReason')}</option>
                {CLOSE_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {t(reason.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCloseModal(false)}
              >
                {t('closeModal.cancel')}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleClose}
                isLoading={isClosing}
              >
                {t('closeModal.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messagesByDate).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {formatDate(date)}
              </span>
            </div>
            <div className="space-y-3">
              {dateMessages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                const isSystemMessage = message.sender_id === SYSTEM_USER_ID || (message as any).is_system_message;
                const messageContent = message.body || (message as any).content || '';
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : isSystemMessage
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-900 rounded-bl-md border border-blue-200'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {isSystemMessage && !isOwn && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-blue-600 font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          System Message
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{renderMessageContent(messageContent)}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Closed State */}
      {isClosed ? (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('conversationClosed')}</span>
            </div>
            {isSeeker && providerId && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{t('leaveReviewPrompt')}</p>
                <Link href={`/p/${providerId}#reviews`}>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {t('leaveReview')}
                  </Button>
                </Link>
              </div>
            )}
            {showGoToActive && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Link href={`/dashboard/messages/${activeConversationId}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {t('goToActiveConversation')}
                  </Button>
                </Link>
              </div>
            )}
            {canReopen && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReopen}
                  isLoading={isReopening}
                >
                  {t('reopenRequest')}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('typeMessage')}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              maxLength={5000}
            />
            <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
              {t('send')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
