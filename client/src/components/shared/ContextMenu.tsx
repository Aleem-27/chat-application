interface ContextMenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        style={{ top: y, left: x }}
        className="fixed z-40 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent-tint ${
              item.danger ? 'text-danger' : 'text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}