"use client"

import { useState, useEffect, type ReactNode } from "react"
import { TypingAnimation } from "./typing-animation"

interface AnimatedOutputProps {
  children: ReactNode
  delay?: number
}

export function AnimatedOutput({ children, delay = 100 }: AnimatedOutputProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!showContent) {
    return <div className="h-4"></div> // Placeholder to prevent layout shift
  }

  // If children is a string, use typing animation
  if (typeof children === "string") {
    return <TypingAnimation text={children} />
  }

  // For complex JSX, show immediately (you could enhance this to type HTML content)
  return <div>{children}</div>
}
