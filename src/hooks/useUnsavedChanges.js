import { useEffect } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

export function useUnsavedChanges(isDirty, message = 'You have unsaved changes. Leave this page and discard them?') {
  useBeforeUnload(event => {
    if (!isDirty) return
    event.preventDefault()
    event.returnValue = ''
  })

  const blocker = useBlocker(Boolean(isDirty))
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(message)) blocker.proceed()
    else blocker.reset()
  }, [blocker, message])
}
