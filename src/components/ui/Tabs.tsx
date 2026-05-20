import { useState } from 'react'
import { cn } from '@/lib/cn'

interface Tab {
  key: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultTab ?? tabs[0]?.key ?? '')

  const activeTab = tabs.find((tab) => tab.key === activeKey)

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            disabled={tab.disabled}
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition',
              activeKey === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
              tab.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab ? <div>{activeTab.content}</div> : null}
    </div>
  )
}
