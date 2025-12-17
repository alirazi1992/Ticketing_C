"use client"

import { useEffect, useMemo, useState } from "react"
import {
  type LucideIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  SunMedium,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/user-menu"
import { usePreferences } from "@/lib/preferences-context"

export interface DashboardNavChild {
  id: string
  title: string
  target: string
  badge?: string | number
}

export interface DashboardNavItem {
  id: string
  title: string
  icon: LucideIcon
  target?: string
  badge?: string | number
  children?: DashboardNavChild[]
}

type Role = "admin" | "engineer" | "client"

interface DashboardShellProps {
  user: {
    name: string
    email: string
    role: Role
    department?: string
    title?: string
    avatar?: string
  }
  navItems: DashboardNavItem[]
  activeItem: string
  onSelect: (target: string) => void
  children: React.ReactNode
}

const roleMeta: Record<
  Role,
  {
    label: string
    badgeClass: string
  }
> = {
  admin: {
    label: "مدیر سیستم",
    badgeClass:
      "border-purple-300 bg-purple-100 text-purple-900 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-100",
  },
  engineer: {
    label: "کارشناس فنی",
    badgeClass:
      "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
  },
  client: {
    label: "کاربر",
    badgeClass:
      "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  },
}

export function DashboardShell({ user, navItems, activeItem, onSelect, children }: DashboardShellProps) {
  const { theme, setTheme } = useTheme()
  const { preferences, updatePreferences } = usePreferences()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  useEffect(() => {
    const expandableIds = navItems.filter((item) => item.children?.length).map((item) => item.id)
    setExpandedSections(expandableIds)
  }, [navItems])

  const handleThemeToggle = async () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    
    // Sync with preferences if user is logged in
    if (preferences) {
      const updated = {
        ...preferences,
        theme: newTheme as "light" | "dark" | "system",
      }
      await updatePreferences(updated)
    }
  }

  const toggleSection = (id: string) => {
    setExpandedSections((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    )
  }

  const handleSelect = (target: string) => {
    onSelect(target)
    setMobileSidebarOpen(false)
  }

  const activeParentIds = useMemo(() => {
    return navItems
      .filter((item) => item.children?.some((child) => child.target === activeItem))
      .map((item) => item.id)
  }, [navItems, activeItem])

  const renderNav = (collapsed: boolean) => (
    <>
      <div className="px-4 pt-6 pb-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-lg font-bold shadow-md text-white">
              AA
            </div>
            {!collapsed && (
              <div className="leading-tight text-right">
                <span className="block text-sm text-muted-foreground">داشبورد</span>
                <span className="block text-xs text-muted-foreground/80">مدیریت درخواست‌های پشتیبانی</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="mt-6 flex items-center gap-3" dir="rtl">
            <Avatar className="h-12 w-12 border border-border bg-card">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.department || "بدون دپارتمان"}</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-end">
                <Badge className={cn("border px-3 py-1", roleMeta[user.role].badgeClass)}>
                  {roleMeta[user.role].label}
                </Badge>
                {user.title && <Badge className="border-border bg-muted text-muted-foreground">{user.title}</Badge>}
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-card" dir="rtl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isParentActive = activeParentIds.includes(item.id)
          const isActive = item.target === activeItem || isParentActive
          const isExpanded = expandedSections.includes(item.id)

          return (
            <div key={item.id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (item.children?.length) {
                    toggleSection(item.id)
                  } else if (item.target) {
                    handleSelect(item.target)
                  }
                }}
                className={cn(
                  "w-full flex items-center rounded-xl px-3 py-2 text-sm transition-colors",
                  collapsed ? "justify-center" : "justify-between",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <div className={cn("flex items-center gap-3", collapsed && "justify-center")} dir="rtl">
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </div>
                {!collapsed && item.children?.length ? (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded ? "rotate-180" : "rotate-0",
                    )}
                  />
                ) : null}
              </button>

              {item.children && item.children.length > 0 && (
                <div
                  className={cn(
                    "overflow-hidden transition-all pr-3 border-r border-border",
                    collapsed ? "hidden" : isExpanded ? "max-h-96 py-2" : "max-h-0",
                  )}
                >
                  <div className="space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = child.target === activeItem
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSelect(child.target)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                            isChildActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                          )}
                        >
                          <span className="flex-1 text-right">{child.title}</span>
                          {child.badge && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-card shadow-2xl transition-transform lg:hidden border-l border-border",
            mobileSidebarOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {renderNav(false)}
        </aside>

        <aside
          className={cn(
            "hidden lg:flex lg:flex-col lg:border-l lg:border-border lg:bg-card lg:shadow-xl lg:transition-all lg:duration-300",
            sidebarCollapsed ? "lg:w-24" : "lg:w-72",
          )}
        >
          {renderNav(sidebarCollapsed)}
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:mr-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 shadow-md backdrop-blur">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:flex lg:items-center lg:gap-2">
                <span className="text-sm text-muted-foreground">مسیر</span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="text-sm font-medium text-foreground">
                  {navItems.find((item) => item.target === activeItem)?.title ||
                    navItems
                      .flatMap((item) => item.children || [])
                      .find((child) => child.target === activeItem)?.title ||
                    "ناشناخته"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleThemeToggle}
                title={theme === "dark" ? "تغییر به حالت روشن" : "تغییر به حالت تیره"}
              >
                {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
