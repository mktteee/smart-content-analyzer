"use client"

import { useState } from "react"
import {
  FileText,
  Video,
  Mic,
  FolderOpen,
  Search,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Clock,
  Star,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ContentType = "document" | "video" | "meeting"

interface ContentItem {
  id: string
  name: string
  type: ContentType
  date: string
  starred?: boolean
}

const mockContents: ContentItem[] = [
  { id: "1", name: "Q4_戦略計画書.pdf", type: "document", date: "2026-03-24", starred: true },
  { id: "2", name: "製品ロードマップ2026.pdf", type: "document", date: "2026-03-23" },
  { id: "3", name: "セールスミーティング_0320.mp4", type: "video", date: "2026-03-20", starred: true },
  { id: "4", name: "取締役会議事録_0318.txt", type: "meeting", date: "2026-03-18" },
  { id: "5", name: "新機能デモ動画.mp4", type: "video", date: "2026-03-15" },
  { id: "6", name: "顧客フィードバックレポート.pdf", type: "document", date: "2026-03-14" },
  { id: "7", name: "週次定例_議事録.txt", type: "meeting", date: "2026-03-12" },
  { id: "8", name: "技術仕様書_v2.pdf", type: "document", date: "2026-03-10" },
]

const getIcon = (type: ContentType) => {
  switch (type) {
    case "document":
      return FileText
    case "video":
      return Video
    case "meeting":
      return Mic
  }
}

const getIconColor = (type: ContentType) => {
  switch (type) {
    case "document":
      return "text-blue-400"
    case "video":
      return "text-pink-400"
    case "meeting":
      return "text-green-400"
  }
}

interface ContentSidebarProps {
  selectedContent: string | null
  onSelectContent: (id: string) => void
}

export function ContentSidebar({ selectedContent, onSelectContent }: ContentSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["recent", "starred"])

  const filteredContents = mockContents.filter((content) =>
    content.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const starredContents = filteredContents.filter((c) => c.starred)
  const recentContents = filteredContents.slice(0, 5)

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folder) ? prev.filter((f) => f !== folder) : [...prev, folder]
    )
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <FolderOpen className="size-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">ContentAI</span>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="コンテンツを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 border-sidebar-border bg-sidebar-accent pl-9 text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Upload Button */}
      <div className="px-3 pb-2">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-dashed border-sidebar-border text-muted-foreground hover:border-primary hover:text-primary">
          <Upload className="size-4" />
          新しいコンテンツをアップロード
        </Button>
      </div>

      {/* Content List */}
      <ScrollArea className="flex-1 px-3">
        {/* Starred */}
        <div className="mb-2">
          <button
            onClick={() => toggleFolder("starred")}
            className="flex w-full items-center gap-1 py-2 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground"
          >
            <ChevronRight
              className={cn(
                "size-3 transition-transform",
                expandedFolders.includes("starred") && "rotate-90"
              )}
            />
            <Star className="size-3" />
            スター付き
          </button>
          {expandedFolders.includes("starred") && (
            <div className="space-y-0.5 pl-4">
              {starredContents.map((content) => {
                const Icon = getIcon(content.type)
                return (
                  <ContentItemRow
                    key={content.id}
                    content={content}
                    Icon={Icon}
                    iconColor={getIconColor(content.type)}
                    isSelected={selectedContent === content.id}
                    onSelect={() => onSelectContent(content.id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Recent */}
        <div className="mb-2">
          <button
            onClick={() => toggleFolder("recent")}
            className="flex w-full items-center gap-1 py-2 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground"
          >
            <ChevronRight
              className={cn(
                "size-3 transition-transform",
                expandedFolders.includes("recent") && "rotate-90"
              )}
            />
            <Clock className="size-3" />
            最近のコンテンツ
          </button>
          {expandedFolders.includes("recent") && (
            <div className="space-y-0.5 pl-4">
              {recentContents.map((content) => {
                const Icon = getIcon(content.type)
                return (
                  <ContentItemRow
                    key={content.id}
                    content={content}
                    Icon={Icon}
                    iconColor={getIconColor(content.type)}
                    isSelected={selectedContent === content.id}
                    onSelect={() => onSelectContent(content.id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* All Contents */}
        <div>
          <button
            onClick={() => toggleFolder("all")}
            className="flex w-full items-center gap-1 py-2 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground"
          >
            <ChevronRight
              className={cn(
                "size-3 transition-transform",
                expandedFolders.includes("all") && "rotate-90"
              )}
            />
            <FolderOpen className="size-3" />
            すべてのコンテンツ
          </button>
          {expandedFolders.includes("all") && (
            <div className="space-y-0.5 pl-4">
              {filteredContents.map((content) => {
                const Icon = getIcon(content.type)
                return (
                  <ContentItemRow
                    key={content.id}
                    content={content}
                    Icon={Icon}
                    iconColor={getIconColor(content.type)}
                    isSelected={selectedContent === content.id}
                    onSelect={() => onSelectContent(content.id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex size-6 items-center justify-center rounded-full bg-sidebar-accent">
            <span className="text-[10px] font-medium text-sidebar-foreground">YT</span>
          </div>
          <div className="flex-1">
            <p className="text-sidebar-foreground">山田 太郎</p>
            <p className="text-[10px]">エンタープライズプラン</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

interface ContentItemRowProps {
  content: ContentItem
  Icon: React.ComponentType<{ className?: string }>
  iconColor: string
  isSelected: boolean
  onSelect: () => void
}

function ContentItemRow({ content, Icon, iconColor, isSelected, onSelect }: ContentItemRowProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isSelected
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", iconColor)} />
      <span className="flex-1 truncate">{content.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 transition-opacity group-hover:opacity-100">
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>
            <Star className="mr-2 size-4" />
            スターを追加
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
