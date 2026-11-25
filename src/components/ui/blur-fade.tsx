import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface BlurFadeProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
  blur?: string
  once?: boolean
}

export function BlurFade({ children, className, delay = 0, duration = 0.45, y = 18, blur = '6px', once = true }: BlurFadeProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: `blur(${blur})` }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y, filter: `blur(${blur})` }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
