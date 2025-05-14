
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function InfluencerInbox() {
  const { user } = useAuth();
  const { conversations, messages, sendMessage, fetchMessages } = useData();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [showContacts, setShowContacts] = useState(!isMobile);
  
  // Get conversation messages
  const conversationMessages = messages.filter(
    msg => 
      (msg.senderId === user?.dbId && msg.receiverId === selectedContact) ||
      (msg.senderId === selectedContact && msg.receiverId === user?.dbId)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Initial load of messages
  useEffect(() => {
    if (user?.dbId) {
      fetchMessages();
      setLoading(false);
    }
  }, [user?.dbId, fetchMessages]);

  // Select admin as default if no conversation is selected and admin is in conversations
  useEffect(() => {
    if (conversations.length > 0 && !selectedContact) {
      // Try to find admin in conversations
      const adminConversation = conversations.find(c => c.id === 'admin-1');
      if (adminConversation) {
        setSelectedContact('admin-1');
      } else {
        // Otherwise select first conversation
        setSelectedContact(conversations[0].id);
      }
    }
  }, [conversations, selectedContact]);

  // Toggle contacts visibility on mobile
  useEffect(() => {
    setShowContacts(!isMobile || (isMobile && !selectedContact));
  }, [isMobile, selectedContact]);

  // Scroll to bottom of messages - but only on new messages or initial load
  useEffect(() => {
    if (messagesEndRef.current && conversationMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  // Setup real-time subscription for new messages
  useEffect(() => {
    if (!user?.dbId) return;

    const channel = supabase
      .channel('influencer-inbox-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.dbId}`
        },
        () => {
          // When we receive a message, refresh messages
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.dbId, fetchMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    try {
      await sendMessage(selectedContact, messageText);
      setMessageText('');
      // Scroll to bottom after sending
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContact(contactId);
    if (isMobile) {
      setShowContacts(false);
    }
  };

  const handleBackToContacts = () => {
    if (isMobile) {
      setShowContacts(true);
    }
  };

  // Format date safely
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px] md:min-h-[600px]">
        {/* Contacts sidebar - conditionally shown on mobile */}
        {showContacts && (
          <Card className="h-full overflow-hidden flex flex-col md:col-span-1 col-span-full">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                <div>
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 ${
                        selectedContact === conversation.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleContactSelect(conversation.id)}
                    >
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conversation.name}</p>
                        {conversation.unread > 0 && (
                          <div className="bg-brand-500 text-white px-2 rounded-full text-xs w-fit">
                            {conversation.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-center">
                    No conversations yet
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Chat area - conditionally sized on mobile */}
        {(!isMobile || (isMobile && !showContacts)) && (
          <Card className={`h-full flex flex-col overflow-hidden ${isMobile ? 'col-span-full' : 'md:col-span-2'}`}>
            {selectedContact ? (
              <>
                {/* Chat header */}
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleBackToContacts} 
                        className="mr-1"
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    )}
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-brand-600" />
                    </div>
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.id === selectedContact)?.name || 'Unknown Contact'}
                    </CardTitle>
                  </div>
                </CardHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversationMessages.length > 0 ? (
                    conversationMessages.map((msg) => {
                      const isOwnMessage = msg.senderId === user?.dbId;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-brand-500 text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-brand-100' : 'text-muted-foreground'}`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-center">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-lg font-medium mb-2">No conversations yet</h2>
                  <p className="text-muted-foreground mb-4">
                    Start by applying to campaigns or messaging the admin.
                  </p>
                  <Button onClick={() => sendMessage('admin-1', 'Hello! I have a question about the platform.')}>
                    Message Admin
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
