import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { ChatbotFab, ChatbotWidget } from '@/components/chatbot'
import { ChatbotPageContextSync } from '@/features/chatbot/ChatbotPageContextSync'

export function DefaultLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Outlet />
      <Footer />
      <ChatbotPageContextSync />
      <ChatbotFab />
      <ChatbotWidget />
    </div>
  )
}
