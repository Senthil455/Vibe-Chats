import { ChatWindow } from '@/components/chat/ChatWindow';

interface Props { params: { chatId: string }; }

export default function ChatIdPage({ params }: Props) {
  return <ChatWindow chatId={params.chatId} />;
}
