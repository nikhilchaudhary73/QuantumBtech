import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SupportMessage } from '../utils/storage';

export const useSupport = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'supportMessages'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: SupportMessage[] = [];
      querySnapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as SupportMessage);
      });
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching support messages realtime: ", err);
      setError("Failed to load messages from the server.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (message: Omit<SupportMessage, 'id'>) => {
    try {
      await addDoc(collection(db, 'supportMessages'), message);
      return { success: true };
    } catch (err: any) {
      console.error("Error sending support message: ", err);
      return { success: false, message: err.message };
    }
  };

  const replyMessage = async (messageId: string, replyText: string) => {
    try {
      const msgRef = doc(db, 'supportMessages', messageId);
      await updateDoc(msgRef, {
        reply: replyText
      });
      return { success: true };
    } catch (err: any) {
      console.error("Error replying to support message: ", err);
      return { success: false, message: err.message };
    }
  };

  return { messages, loading, error, sendMessage, replyMessage };
};
