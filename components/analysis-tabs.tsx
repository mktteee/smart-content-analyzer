"use client"

import { Shield, FileText, ListTodo, Settings, Bell } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AnalysisTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AnalysisTabs({ activeTab, onTabChange }: AnalysisTabsProps) {
  const tabs = [
    {
      id: "confidential",
      label: "機密情報チェック",
      icon: Shield,
      badge: 3,
      badgeVariant: "destructive" as const,
    },
    {
      id: "summary",
      label: "要約生成",
      icon: FileText,
      badge: null,
      badgeVariant: null,
    },
    {
      id: "tasks",
      label: "タスク抽出",
      icon: ListTodo,
      badge: 5,
      badgeVariant: "secondary" as const,
    },
  ]

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="h-10 bg-secondary">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                )}
              >
                <tab.icon className="size-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge
                    variant={tab.badgeVariant || "default"}
                    className={cn(
                      "ml-1 size-5 justify-center rounded-full p-0 text-[10px]",
                      activeTab === tab.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : ""
                    )}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative size-9">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
        </Button>
        <Button variant="ghost" size="icon" className="size-9">
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  )
}
