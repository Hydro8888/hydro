'use client'

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

interface ChecklistProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  disabled?: boolean
}

export function Checklist({ items, onChange, disabled }: ChecklistProps) {
  const toggleItem = (itemId: string) => {
    if (disabled) return
    const updated = items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    onChange(updated)
  }

  const completedCount = items.filter(i => i.completed).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">체크리스트</span>
        <span className="text-muted-foreground">
          {completedCount}/{items.length} 완료
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: items.length > 0 ? `${(completedCount / items.length) * 100}%` : '0%' }}
        />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              item.completed ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item.id)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
