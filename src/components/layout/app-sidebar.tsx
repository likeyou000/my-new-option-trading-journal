"use client"

import { cn } from "@/lib/utils"
import { useAppStore, type ViewType } from "@/store/app-store"
import {
  LayoutDashboard,
  PlusCircle,
  ScrollText,
  BarChart3,
  Brain,
  Calendar,
  Repeat,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "add-trade", label: "Add Trade", icon: PlusCircle },
  { view: "history", label: "Trade History", icon: ScrollText },
  { view: "reports", label: "Reports", icon: BarChart3 },
  { view: "ai-analyzer", label: "AI Analyzer", icon: Brain },
  { view: "calendar", label: "Calendar", icon: Calendar },
  { view: "backtest", label: "Backtesting", icon: Repeat },
]

export function AppSidebar() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore()

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view)
    // Auto-close sidebar on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
          // On mobile: slide in/out
          sidebarOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full lg:translate-x-0 lg:w-16"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 sm:h-16 items-center gap-3 px-4 border-b border-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="overflow-hidden lg:overflow-hidden" style={{ maxWidth: sidebarOpen ? '200px' : '0px', opacity: sidebarOpen ? 1 : 0, transition: 'all 0.3s' }}>
            <h1 className="text-base font-bold tracking-tight whitespace-nowrap">
              TradeDiary AI
            </h1>
            <p className="text-[10px] text-muted-foreground whitespace-nowrap">Smart Trading Journal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.view
            const button = (
              <Button
                key={item.view}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 transition-all",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500 font-medium"
                    : "text-muted-foreground hover:text-foreground",
                  !sidebarOpen && "lg:justify-center lg:px-0"
                )}
                onClick={() => handleNavClick(item.view)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Button>
            )

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.view}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="hidden lg:block">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.view}>{button}</div>
          })}
        </nav>

        <Separator />

        {/* Collapse button - desktop only */}
        <div className="p-2 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
