"use client"

import { useState } from "react"
import { ContentSidebar } from "@/components/content-sidebar"
import { ContentPreview } from "@/components/content-preview"
import { AIChatPanel } from "@/components/ai-chat-panel"
import { AnalysisTabs } from "@/components/analysis-tabs"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function ContentAnalysisPlatform() {
  const [selectedContent, setSelectedContent] = useState<string | null>("1")
  const [activeTab, setActiveTab] = useState("confidential")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <ContentSidebar
        selectedContent={selectedContent}
        onSelectContent={setSelectedContent}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Tabs */}
        <AnalysisTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Area - Two Column Layout */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left: Preview Panel */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ContentPreview selectedContent={selectedContent} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: AI Chat Panel */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <AIChatPanel activeTab={activeTab} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
