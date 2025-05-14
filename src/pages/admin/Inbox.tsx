
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { User } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export default function AdminInbox() {
  const { user } = useAuth();
  const { conversations, influencers, messages, sendMessage } = useData();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Get the selectedContactUser details
  const selectedContactUser = influencers.find(i => i.id === selectedContact);

  // Select first conversation as default or when conversations change
  useEffect(() => {
    if (conversations.length > 0 && !selectedContact) {
      setSelectedContact(conversations[0].id);
    }
    setLoading(false);
  }, [conversations, selectedContact]);

  // Get conversation messages
  const conversationMessages = messages.filter(
    msg => 
      (msg.senderId === user?.id && msg.receiverId === selectedContact) ||
      (msg.senderId === selectedContact && msg.receiverId === user?.id)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;

    sendMessage(selectedContact, messageText);
    setMessageText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Contacts sidebar */}
        <Card className="h-full overflow-hidden flex flex-col">
          <CardHeader className="border-b pb-3">
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
                    onClick={() => setSelectedContact(conversation.id)}
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

        {/* Chat area */}
        <Card className="h-full md:col-span-2 flex flex-col overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand-600" />
                  </div>
                  <CardTitle className="text-lg">
                    {selectedContactUser?.name || 'Unknown Contact'}
                  </CardTitle>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.length > 0 ? (
                  conversationMessages.map((msg) => {
                    const isOwnMessage = msg.senderId === user?.id;

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
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
              <div className="text-center p-4">
                <h2 className="text-lg font-medium mb-2">Select a conversation</h2>
                <p className="text-muted-foreground mb-4">
                  Choose a conversation from the sidebar to start messaging.
                </p>
                {conversations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No conversations available. Influencers will appear here when they message you.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
