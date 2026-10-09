import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type CopyableEllipsisProps = {
  value: string | number
}

export default function CopyableEllipsis({ value }: CopyableEllipsisProps) {
  const text = String(value)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const [popover, setPopover] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const measure = () => {
      const truncated = trigger.scrollWidth > trigger.clientWidth + 1
      setIsTruncated(truncated)
      if (!truncated) setPopover(null)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(trigger)
    return () => {
      observer.disconnect()
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    }
  }, [text])

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const showPopover = () => {
    cancelClose()
    const trigger = triggerRef.current
    if (!trigger || !isTruncated || trigger.scrollWidth <= trigger.clientWidth + 1) return
    const rect = trigger.getBoundingClientRect()
    const width = Math.min(Math.max(rect.width, trigger.scrollWidth + 24), 360, window.innerWidth - 24)
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
    setPopover({ top: rect.bottom + 7, left, width })
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimerRef.current = window.setTimeout(() => setPopover(null), 140)
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="copyable-ellipsis-trigger"
        role={isTruncated ? 'button' : undefined}
        tabIndex={isTruncated ? 0 : undefined}
        aria-label={isTruncated ? `查看完整内容：${text}` : undefined}
        onMouseEnter={showPopover}
        onMouseLeave={scheduleClose}
        onFocus={showPopover}
        onBlur={scheduleClose}
        onClick={showPopover}
      >
        {text}
      </span>
      {popover && createPortal(
        <div
          className="copyable-ellipsis-popover"
          role="tooltip"
          style={{ top: popover.top, left: popover.left, width: popover.width }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <span>{text}</span>
        </div>,
        document.body,
      )}
    </>
  )
}
