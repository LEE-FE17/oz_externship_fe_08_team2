import { useState } from 'react'
import { Bot } from 'lucide-react'
import chatbotRobot from '@/assets/chatbot-robot.png'

interface ChatbotRobotImageProps {
  className: string
}

export function ChatbotRobotImage({ className }: ChatbotRobotImageProps) {
  const [isBroken, setIsBroken] = useState(false)

  if (isBroken) {
    return (
      <Bot
        aria-hidden="true"
        className={className}
        color="#58249D"
        strokeWidth={1.8}
      />
    )
  }

  return (
    <img
      src={chatbotRobot}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
      onError={() => setIsBroken(true)}
    />
  )
}
