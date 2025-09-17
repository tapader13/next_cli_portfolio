"use client"

import { useState, useEffect, type ReactNode } from "react"

interface TypingOutputProps {
  children: ReactNode
  onComplete?: () => void
  speed?: number
}

export function TypingOutput({ children, onComplete, speed = 30 }: TypingOutputProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [formattedLines, setFormattedLines] = useState<string[]>([])

  useEffect(() => {
    // Pre-format the content into lines
    const lines = formatContentToLines(children)
    setFormattedLines(lines)
    setDisplayedLines(new Array(lines.length).fill(""))
    setCurrentLineIndex(0)
    setCurrentCharIndex(0)
    setIsComplete(false)
  }, [children])

  useEffect(() => {
    if (formattedLines.length === 0 || isComplete) return

    const currentLine = formattedLines[currentLineIndex]

    if (currentCharIndex < currentLine.length) {
      // Type current character
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const newLines = [...prev]
          newLines[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1)
          return newLines
        })
        setCurrentCharIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (currentLineIndex < formattedLines.length - 1) {
      // Move to next line
      const timer = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1)
        setCurrentCharIndex(0)
      }, speed * 2) // Small pause between lines

      return () => clearTimeout(timer)
    } else {
      // All lines complete
      setIsComplete(true)
      if (onComplete) {
        setTimeout(onComplete, 300)
      }
    }
  }, [currentLineIndex, currentCharIndex, formattedLines, speed, onComplete, isComplete])

  // Helper function to format React content into lines
  const formatContentToLines = (node: ReactNode): string[] => {
    const textContent = extractTextContent(node)
    return textContent.split("\n").filter((line) => line.trim() !== "")
  }

  // Helper function to extract text content from React nodes
  const extractTextContent = (node: ReactNode): string => {
    if (typeof node === "string") return node
    if (typeof node === "number") return node.toString()
    if (!node) return ""

    if (Array.isArray(node)) {
      return node.map(extractTextContent).join("")
    }

    if (typeof node === "object" && "props" in node) {
      if (node.props?.children) {
        return extractTextContent(node.props.children)
      }
    }

    return ""
  }

  if (isComplete) {
    return <div>{children}</div>
  }

  return (
    <div className="relative">
      {displayedLines.map((line, index) => (
        <div key={index} className="min-h-[1.2em]">
          {line}
          {index === currentLineIndex && <span className="animate-pulse text-green-400">▋</span>}
        </div>
      ))}
    </div>
  )
}
