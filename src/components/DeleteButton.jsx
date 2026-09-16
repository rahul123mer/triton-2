import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Button, Modal } from './ui'
import { usePrincipal } from '../hooks/usePrincipal'

/**
 * Destructive delete, behind a typed confirmation.
 *
 * Deleting is irreversible and removes derived work, so it asks the operator to type
 * the name back rather than relying on a single click. Rendered only when the caller
 * actually holds the permission — the API enforces it regardless, but offering a
 * button that always 403s is worse than not offering one.
 */
export function DeleteButton({ permission, label, name, onDelete, onDone, note, subtle = false }) {
  const access = usePrincipal()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const remove = useMutation({
    mutationFn: onDelete,
    onSuccess: () => { qc.invalidateQueries(); setOpen(false); setTyped(''); onDone?.() },
  })
  if (!access.can(permission)) return null

  return <>
    {/* In a list, one red block per card makes DELETE the loudest thing on a page
        whose purpose is reading scores. `subtle` keeps the same guarded action but
        gives it the visual weight of a row control; the typed confirmation below
        is unchanged either way. */}
    {subtle
      ? <button className="icon-button danger-ghost" title={label} aria-label={label} onClick={() => setOpen(true)}><Trash2 size={15}/></button>
      : <Button variant="danger" onClick={() => setOpen(true)}><Trash2 size={14} />{label}</Button>}
    {open && <Modal title={`Delete ${name}?`} onClose={() => { setOpen(false); setTyped('') }}
      footer={<>
        <Button variant="secondary" onClick={() => { setOpen(false); setTyped('') }}>Cancel</Button>
        <Button variant="danger" disabled={typed !== name || remove.isPending}
          onClick={() => remove.mutate()}>
          <Trash2 size={14} />{remove.isPending ? 'Deleting…' : 'Delete permanently'}
        </Button>
      </>}>
      <p className="delete-warning">This cannot be undone. {note}</p>
      <label className="field-label">Type <strong>{name}</strong> to confirm
        <input value={typed} onChange={e => setTyped(e.target.value)}
          aria-label={`Type ${name} to confirm deletion`} autoFocus />
      </label>
      {remove.isError && <p className="weight-error" role="alert">{remove.error.message}</p>}
    </Modal>}
  </>
}
