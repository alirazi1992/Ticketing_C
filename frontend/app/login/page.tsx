"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      router.replace("/")
    }
  }, [user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const ok = await login(email.trim(), password)
      if (ok) {
        router.replace("/")
      } else {
        setError("Invalid username or password. Please check your credentials and ensure the backend server is running.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMessage = err?.message?.includes("fetch") || err?.message?.includes("Failed to fetch")
        ? "Cannot connect to the server. Please ensure the backend is running on http://localhost:5000"
        : "Something went wrong. Please try again."
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground relative">
      {/* Full-page Container Ship Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            // Prefer PNG provided by user; fallback keeps placeholder
            backgroundImage: "url('/container-ship-bg.png'), url('/placeholder.jpg')",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/70" />
      </div>

      {/* Login form - centered on background */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow md:text-5xl">
              AsiaApp
            </h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="bg-background border-input focus:border-primary text-foreground placeholder:text-muted-foreground"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="bg-background border-input focus:border-primary text-foreground placeholder:text-muted-foreground pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || isLoading}
            >
              {submitting || isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/40 border-t-foreground" />
                  Signing in...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </Button>

            {/* Demo credentials for local testing */}
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p>Client: client1@test.com / Client123!</p>
              <p>Technician: tech1@test.com / Tech123!</p>
              <p>Admin: admin@test.com / Admin123!</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
