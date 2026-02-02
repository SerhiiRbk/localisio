'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  is_system_message: boolean;
  sent_by_admin_id: string | null;
  created_at: string;
  admin_name: string | null;
  is_from_user: boolean;
  is_from_system: boolean;
}

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminUserChatPage({ params }: Props) {
  const { id: userId } = use(params);
  const t = useTranslations('admin');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
  }, [userId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChat() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/chat`);
      if (!response.ok) {
        throw new Error('Failed to load chat');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setUser(data.user);
      setConversationId(data.conversation_id);
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              ← Back to Users
            </Button>
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar_url} alt={user.display_name} size="md" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Chat with {user.display_name}
                </h1>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <Badge variant={user.role === 'provider' ? 'info' : 'default'} size="sm">
                {user.role}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <Card className="h-[800px] flex flex-col">
        <CardHeader className="border-b bg-slate-50 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h2 className="font-semibold">System Messages</h2>
            {messages.length > 0 && (
              <Badge variant="default" size="sm">{messages.length} messages</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <span className="text-4xl mb-4">📭</span>
              <p>No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_user ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.is_from_user
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-900'
                    }`}
                  >
                    {/* Admin label */}
                    {message.is_from_system && message.admin_name && (
                      <div className={`text-xs mb-1 ${message.is_from_user ? 'text-slate-500' : 'text-gray-500'}`}>
                        Sent by: {message.admin_name}
                      </div>
                    )}
                    
                    {/* Message body */}
                    <div className={message.is_from_user ? '' : 'prose-invert'}>
                      <MarkdownRenderer content={message.body} />
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs mt-2 ${message.is_from_user ? 'text-slate-400' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                      {message.is_system_message && !message.is_from_user && (
                        <span className="ml-2">• System</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4 flex-shrink-0">
          <form onSubmit={handleSend} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim() && !isSending) {
                      handleSend(e);
                    }
                  }
                }}
                placeholder="Type your message... (Supports Markdown)"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                rows={3}
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                Shift+Enter for new line • Supports **bold**, *italic*, [links](url), and more
              </p>
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="self-start"
            >
              {isSending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Sending...
                </span>
              ) : (
                'Send'
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewMessage('**Welcome to Localisio!**\n\nWe\'re glad to have you here. If you have any questions, feel free to reach out.\n\nBest regards,\nLocalisio Team')}
        >
          📝 Welcome Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewMessage('**Hello!**\n\nThank you for contacting us. We\'ve received your message and will get back to you shortly.\n\nBest regards,\nLocalisio Support')}
        >
          📝 Support Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={loadChat}
        >
          🔄 Refresh
        </Button>
      </div>
    </div>
  );
}
