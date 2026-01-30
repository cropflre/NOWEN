import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface TypewriterProps {
  words?: string[]
  /** 动态获取下一条内容的函数 */
  getNextWord?: () => string
  /** 初始显示的第一条内容 */
  initialWord?: string
  className?: string
  cursorClassName?: string
  typingSpeed?: number
  deletingSpeed?: number
  delayBetweenWords?: number
  /** 是否整句显示（淡入淡出切换），而非逐字打字 */
  fullSentence?: boolean
}

export function Typewriter({
  words,
  getNextWord,
  initialWord,
  className,
  cursorClassName,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenWords = 2000,
  fullSentence = false,
}: TypewriterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentWord, setCurrentWord] = useState(initialWord || (words ? words[0] : ''))

  // 获取下一条内容
  const fetchNextWord = useCallback(() => {
    if (getNextWord) {
      setCurrentWord(getNextWord())
    } else if (words) {
      setCurrentWordIndex((prev) => (prev + 1) % words.length)
    }
  }, [getNextWord, words])

  // 整句模式：定时切换
  useEffect(() => {
    if (!fullSentence) return

    const interval = setInterval(() => {
      fetchNextWord()
    }, delayBetweenWords)

    return () => clearInterval(interval)
  }, [fullSentence, delayBetweenWords, fetchNextWord])

  // 打字模式：逐字显示
  useEffect(() => {
    if (fullSentence) return

    const targetWord = getNextWord ? currentWord : (words ? words[currentWordIndex] : '')

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (currentText.length < targetWord.length) {
            setCurrentText(targetWord.slice(0, currentText.length + 1))
          } else {
            // Wait before deleting
            setTimeout(() => setIsDeleting(true), delayBetweenWords)
          }
        } else {
          // Deleting
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1))
          } else {
            setIsDeleting(false)
            fetchNextWord()
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    )

    return () => clearTimeout(timeout)
  }, [fullSentence, currentText, isDeleting, currentWordIndex, words, currentWord, getNextWord, typingSpeed, deletingSpeed, delayBetweenWords, fetchNextWord])

  // 计算最长文字的宽度作为最小宽度（用于固定数组）
  const longestWord = words ? words.reduce((a, b) => (a.length > b.length ? a : b), '') : currentWord

  // 当前要显示的内容
  const displayWord = getNextWord ? currentWord : (words ? words[currentWordIndex] : '')

  // 整句模式渲染
  if (fullSentence) {
    return (
      <span className={cn('inline-flex items-center justify-center', className)}>
        <span className="relative">
          {/* 隐藏的占位符，保持最小宽度 */}
          <span className="invisible">{longestWord}</span>
          {/* 实际显示的文字，绝对定位居中，淡入淡出 */}
          <AnimatePresence mode="wait">
            <motion.span
              key={displayWord}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              {displayWord}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    )
  }

  // 打字模式渲染
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <span className="relative">
        {/* 隐藏的占位符，保持最小宽度 */}
        <span className="invisible">{longestWord}</span>
        {/* 实际显示的文字，绝对定位居中 */}
        <span className="absolute inset-0 flex items-center justify-center">
          {currentText}
        </span>
      </span>
      <motion.span
        className={cn(
          'inline-block w-[3px] h-[1em] ml-1 bg-current',
          cursorClassName
        )}
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
      />
    </span>
  )
}
