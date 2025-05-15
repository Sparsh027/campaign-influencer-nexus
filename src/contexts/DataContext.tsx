
  // Send message
  const sendMessage = async (receiverId: string, content: string) => {
    if (!user?.dbId) {
      console.error('User ID not available');
      return;
    }

    try {
      const receiverType = user.role === 'admin' ? 'influencer' : 'admin';
      
      // Convert to database field names
      const dbMessage = {
        sender_type: user.role as 'admin' | 'influencer',
        sender_id: user.dbId,
        receiver_type: receiverType as 'admin' | 'influencer',
        receiver_id: receiverId,
        content: content,
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(dbMessage)
        .select()
        .single();

      if (error) throw error;

      // Format the message for our state
      const newMessage: Message = {
        id: data.id,
        senderType: data.sender_type,
        senderId: data.sender_id,
        receiverType: data.receiver_type,
        receiverId: data.receiver_id,
        content: data.content,
        read: data.read || false,
        createdAt: data.created_at
      };
      
      // Update local state
      setMessages(prev => [...prev, newMessage]);

      // Create notification for the receiver
      await createNotification({
        type: 'new_message',
        message: `New message from ${user.name}`,
        targetType: receiverType,
        targetId: receiverId,
        userId: receiverId,
        read: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
