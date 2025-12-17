"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Eye, EyeOff, LogIn, UserPlus, Shield, Wrench, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"


const loginSchema = yup.object({
  email: yup.string().required("Ø§ÛŒÙ…ÛŒÙ„ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª").email("ÙØ±Ù…Øª Ø§ÛŒÙ…ÛŒÙ„ ØµØ­ÛŒØ­ Ù†ÛŒØ³Øª"),
  password: yup.string().required("Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª").min(6, "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û¶ Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§Ø´Ø¯"),
})

const signupSchema = yup.object({
  name: yup.string().required("Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª").min(2, "Ù†Ø§Ù… Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û² Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§Ø´Ø¯"),
  email: yup.string().required("Ø§ÛŒÙ…ÛŒÙ„ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª").email("ÙØ±Ù…Øª Ø§ÛŒÙ…ÛŒÙ„ ØµØ­ÛŒØ­ Ù†ÛŒØ³Øª"),
  phone: yup
    .string()
    .required("Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª")
    .matches(/^(\+98|0)?9\d{9}$/, "Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª"),
  department: yup.string().required("Ø§Ù†ØªØ®Ø§Ø¨ Ø¨Ø®Ø´ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  role: yup.string().required("Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ù‚Ø´ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  password: yup.string().required("Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª").min(6, "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û¶ Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§Ø´Ø¯"),
  confirmPassword: yup
    .string()
    .required("ØªÚ©Ø±Ø§Ø± Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª")
    .oneOf([yup.ref("password")], "Ø±Ù…Ø²Ù‡Ø§ÛŒ Ø¹Ø¨ÙˆØ± Ù…Ø·Ø§Ø¨Ù‚Øª Ù†Ø¯Ø§Ø±Ù†Ø¯"),
})

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login, register } = useAuth()
  const [activeTab, setActiveTab] = useState("login")
  const [loginType, setLoginType] = useState("client")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  
  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      department: "",
      role: "client",
      password: "",
      confirmPassword: "",
    },
  })

  const handleLogin = async (data: any) => {
    try {
      const success = await login(data.email, data.password)
      if (success) {
        toast({
          title: "ÙˆØ±ÙˆØ¯ Ù…ÙˆÙÙ‚",
          description: "Ø¨Ù‡ Ø³ÛŒØ³ØªÙ… Ø®ÙˆØ´ Ø¢Ù…Ø¯ÛŒØ¯",
        })
        onOpenChange(false)
        loginForm.reset()
      } else {
        toast({
          title: "Ø®Ø·Ø§ Ø¯Ø± ÙˆØ±ÙˆØ¯",
          description: "Ø§ÛŒÙ…ÛŒÙ„ ÛŒØ§ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø§Ø´ØªØ¨Ø§Ù‡ Ø§Ø³Øª",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ø®Ø·Ø§ Ø¯Ø± ÙˆØ±ÙˆØ¯",
        description: "Ù…Ø´Ú©Ù„ÛŒ Ø¯Ø± Ø³ÛŒØ³ØªÙ… Ø±Ø® Ø¯Ø§Ø¯Ù‡ Ø§Ø³Øª",
        variant: "destructive",
      })
    }
  }

  const handleSignup = async (data: any) => {
    try {
      const success = await register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        role: data.role,
        password: data.password,
      })

      if (success) {
        toast({
          title: "Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ù…ÙˆÙÙ‚",
          description: "Ø­Ø³Ø§Ø¨ Ø´Ù…Ø§ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø§ÛŒØ¬Ø§Ø¯ Ø´Ø¯",
        })
        onOpenChange(false)
        signupForm.reset()
        setActiveTab("login")
      } else {
        toast({
          title: "Ø®Ø·Ø§ Ø¯Ø± Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…",
          description: "Ø§ÛŒÙ† Ø§ÛŒÙ…ÛŒÙ„ Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ø®Ø·Ø§ Ø¯Ø± Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…",
        description: "Ù…Ø´Ú©Ù„ÛŒ Ø¯Ø± Ø³ÛŒØ³ØªÙ… Ø±Ø® Ø¯Ø§Ø¯Ù‡ Ø§Ø³Øª",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />
      case "technician":
        return <Wrench className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Ù…Ø¯ÛŒØ± Ø³ÛŒØ³ØªÙ…"
      case "technician":
        return "ØªÚ©Ù†Ø³ÛŒÙ†"
      default:
        return "Ú©Ø§Ø±Ø¨Ø±"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {activeTab === "login" ? "ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø³ÛŒØ³ØªÙ…" : "Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ø¯Ø± Ø³ÛŒØ³ØªÙ…"}
          </DialogTitle>
          <DialogDescription className="text-right">
            {activeTab === "login"
              ? "Ø¨Ø±Ø§ÛŒ Ø¯Ø³ØªØ±Ø³ÛŒ Ø¨Ù‡ Ø³ÛŒØ³ØªÙ…ØŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø®ÙˆØ¯ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯"
              : "Ø¨Ø±Ø§ÛŒ Ø§ÛŒØ¬Ø§Ø¯ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø¬Ø¯ÛŒØ¯ØŒ ÙØ±Ù… Ø²ÛŒØ± Ø±Ø§ ØªÚ©Ù…ÛŒÙ„ Ú©Ù†ÛŒØ¯"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="w-4 h-4" />
              ÙˆØ±ÙˆØ¯
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {/* Role Selection for Login */}
            <div className="space-y-2">
              <Label className="text-right">Ù†ÙˆØ¹ Ú©Ø§Ø±Ø¨Ø±ÛŒ</Label>
              <Tabs value={loginType} onValueChange={setLoginType} className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="client" className="gap-1 text-xs">
                    <User className="w-3 h-3" />
                    Ú©Ø§Ø±Ø¨Ø±
                  </TabsTrigger>
                  <TabsTrigger value="technician" className="gap-1 text-xs">
                    <Wrench className="w-3 h-3" />
                    ØªÚ©Ù†Ø³ÛŒÙ†
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-1 text-xs">
                    <Shield className="w-3 h-3" />
                    Ù…Ø¯ÛŒØ±
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-right">
                  Ø§ÛŒÙ…ÛŒÙ„
                </Label>
                <Controller
                  name="email"
                  control={loginForm.control}
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="example@domain.com" className="text-right" dir="rtl" />
                  )}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500 text-right">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-right">
                  Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±
                </Label>
                <div className="relative">
                  <Controller
                    name="password"
                    control={loginForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø®ÙˆØ¯ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯"
                        className="text-right pl-10"
                        dir="rtl"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500 text-right">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? "Ø¯Ø± Ø­Ø§Ù„ ÙˆØ±ÙˆØ¯..." : "ÙˆØ±ÙˆØ¯"}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">Ø­Ø³Ø§Ø¨â€ŒÙ‡Ø§ÛŒ Ù†Ù…ÙˆÙ†Ù‡ Ø¨Ø±Ø§ÛŒ ØªØ³Øª:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Ú©Ø§Ø±Ø¨Ø±: client1@test.com / Client123!</span>
                  <User className="w-3 h-3" />
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>ØªÚ©Ù†Ø³ÛŒÙ†: tech1@test.com / Tech123!</span>
                  <Wrench className="w-3 h-3" />
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Ù…Ø¯ÛŒØ±: admin@test.com / Admin123!</span>
                  <Shield className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ù†Ø¯Ø§Ø±ÛŒØ¯ØŸ</p>
              <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setActiveTab("signup")}>
                Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ú©Ù†ÛŒØ¯
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right">
                    Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ *
                  </Label>
                  <Controller
                    name="name"
                    control={signupForm.control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Ù†Ø§Ù… Ú©Ø§Ù…Ù„ Ø®ÙˆØ¯ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯" className="text-right" dir="rtl" />
                    )}
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-sm text-red-500 text-right">{signupForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right">
                    Ø§ÛŒÙ…ÛŒÙ„ *
                  </Label>
                  <Controller
                    name="email"
                    control={signupForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="example@domain.com"
                        className="text-right"
                        dir="rtl"
                      />
                    )}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-red-500 text-right">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right">
                    Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³ *
                  </Label>
                  <Controller
                    name="phone"
                    control={signupForm.control}
                    render={({ field }) => (
                      <Input {...field} placeholder="09xxxxxxxxx" className="text-right" dir="rtl" />
                    )}
                  />
                  {signupForm.formState.errors.phone && (
                    <p className="text-sm text-red-500 text-right">{signupForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-right">
                    Ø¨Ø®Ø´ *
                  </Label>
                  <Controller
                    name="department"
                    control={signupForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="Ø§Ù†ØªØ®Ø§Ø¨ Ø¨Ø®Ø´" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="it">ÙÙ†Ø§ÙˆØ±ÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª</SelectItem>
                          <SelectItem value="hr">Ù…Ù†Ø§Ø¨Ø¹ Ø§Ù†Ø³Ø§Ù†ÛŒ</SelectItem>
                          <SelectItem value="finance">Ù…Ø§Ù„ÛŒ</SelectItem>
                          <SelectItem value="marketing">Ø¨Ø§Ø²Ø§Ø±ÛŒØ§Ø¨ÛŒ</SelectItem>
                          <SelectItem value="operations">Ø¹Ù…Ù„ÛŒØ§Øª</SelectItem>
                          <SelectItem value="accounting">Ø­Ø³Ø§Ø¨Ø¯Ø§Ø±ÛŒ</SelectItem>
                          <SelectItem value="sales">ÙØ±ÙˆØ´</SelectItem>
                          <SelectItem value="other">Ø³Ø§ÛŒØ±</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {signupForm.formState.errors.department && (
                    <p className="text-sm text-red-500 text-right">{signupForm.formState.errors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-right">
                    Ù†Ù‚Ø´ *
                  </Label>
                  <Controller
                    name="role"
                    control={signupForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ù‚Ø´" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Ú©Ø§Ø±Ø¨Ø±
                            </div>
                          </SelectItem>
                          <SelectItem value="engineer">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4" />
                              ØªÚ©Ù†Ø³ÛŒÙ†
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {signupForm.formState.errors.role && (
                    <p className="text-sm text-red-500 text-right">{signupForm.formState.errors.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-right">
                    Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± *
                  </Label>
                  <div className="relative">
                    <Controller
                      name="password"
                      control={signupForm.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Ø­Ø¯Ø§Ù‚Ù„ Û¶ Ú©Ø§Ø±Ø§Ú©ØªØ±"
                          className="text-right pl-10"
                          dir="rtl"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-red-500 text-right">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-right">
                    ØªÚ©Ø±Ø§Ø± Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± *
                  </Label>
                  <div className="relative">
                    <Controller
                      name="confirmPassword"
                      control={signupForm.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø±Ø§ Ù…Ø¬Ø¯Ø¯Ø§Ù‹ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯"
                          className="text-right pl-10"
                          dir="rtl"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 text-right">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                {signupForm.formState.isSubmitting ? "Ø¯Ø± Ø­Ø§Ù„ Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…..." : "Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ú©Ø±Ø¯Ù‡â€ŒØ§ÛŒØ¯ØŸ</p>
              <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setActiveTab("login")}>
                ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

