import { motion } from 'framer-motion'

interface BlurTextProps {
  text: string
  className?: string
  delay?: number
  animateBy?: 'words' | 'letters'
}

export function BlurText({ text, className = '', delay = 0, animateBy = 'words' }: BlurTextProps) {
  const items = animateBy === 'words' ? text.split(' ') : text.split('')
  return (
    <span className={className}>
      {items.map((item, i) => (
        <motion.span
          key={`${item}-${i}`}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 8 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.35, delay: delay + i * 0.04, ease: 'easeOut' }}
          className="inline-block"
        >
          {item}{animateBy === 'words' && i < items.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}
