"use client"

import { useState } from "react"
import {
  FileText,
  Video,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ContentPreviewProps {
  selectedContent: string | null
}

export function ContentPreview({ selectedContent }: ContentPreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 12

  const isVideo = selectedContent === "3" || selectedContent === "5"
  const hasContent = selectedContent !== null

  if (!hasContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-foreground">コンテンツを選択</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          左のサイドバーからPDF、動画、議事録などのコンテンツを選択してプレビューを表示します
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          {isVideo ? (
            <Video className="size-4 text-pink-400" />
          ) : (
            <FileText className="size-4 text-blue-400" />
          )}
          <span className="text-sm font-medium text-foreground">
            {selectedContent === "1" && "Q4_戦略計画書.pdf"}
            {selectedContent === "2" && "製品ロードマップ2026.pdf"}
            {selectedContent === "3" && "セールスミーティング_0320.mp4"}
            {selectedContent === "4" && "取締役会議事録_0318.txt"}
            {selectedContent === "5" && "新機能デモ動画.mp4"}
            {selectedContent === "6" && "顧客フィードバックレポート.pdf"}
            {selectedContent === "7" && "週次定例_議事録.txt"}
            {selectedContent === "8" && "技術仕様書_v2.pdf"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isVideo && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
              >
                <ZoomIn className="size-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="size-8">
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        {isVideo ? (
          <div className="w-full max-w-3xl">
            {/* Video Player */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-card">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card to-muted">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary/20">
                    <Play className="size-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">動画プレビュー</p>
                </div>
              </div>
              {/* Video Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                <div className="mb-2">
                  <Slider defaultValue={[35]} max={100} className="h-1" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8">
                      <SkipBack className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8">
                      <SkipForward className="size-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">05:23 / 15:47</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="size-4 text-muted-foreground" />
                    <Slider defaultValue={[70]} max={100} className="h-1 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* PDF Preview Mock */}
            <div className="h-[600px] w-[450px] p-8">
              <div className="mb-6 h-8 w-3/4 rounded bg-muted" />
              <div className="mb-4 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
              <div className="mb-6 h-40 rounded bg-muted/50" />
              <div className="mb-4 h-5 w-1/2 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-11/12 rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
              <div className="mt-6 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Navigation (for PDFs) */}
      {!isVideo && (
        <div className="flex items-center justify-center gap-4 border-t border-border py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            前のページ
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            次のページ
          </Button>
        </div>
      )}
    </div>
  )
}
