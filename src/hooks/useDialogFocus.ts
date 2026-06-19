import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
  )
}

/** Trap focus inside a modal dialog and restore focus to the trigger on close. */
export function useDialogFocus(open: boolean, dialogRef: RefObject<HTMLDialogElement | null>): void {
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusables = getFocusableElements(dialog)
    focusables[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !dialog) return
      const items = getFocusableElements(dialog)
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', onKeyDown)
    return () => {
      dialog.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [open, dialogRef])
}
