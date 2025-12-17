"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api-client";
import type { ApiTicketResponse, ApiTicketMessageDto } from "@/lib/api-types";
import { mapApiTicketToUi, mapApiMessageToResponse } from "@/lib/ticket-mappers";
import { useCategories } from "@/services/useCategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Calendar, Hash, User, Flag, MessageSquare } from "lucide-react";
import type { Ticket } from "@/types";

const statusLabels: Record<string, string> = {
  open: "باز",
  "in-progress": "در حال انجام",
  resolved: "حل شده",
  closed: "بسته",
};

const statusColors: Record<string, string> = {
  open: "bg-rose-100 text-rose-700 border border-rose-200",
  "in-progress": "bg-amber-100 text-amber-700 border border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border border-slate-200",
};

const priorityLabels: Record<string, string> = {
  low: "پایین",
  medium: "متوسط",
  high: "بالا",
  urgent: "بحرانی",
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const { categories } = useCategories();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ticketId = params.id as string;

  useEffect(() => {
    if (!token || !ticketId) {
      setError("دسترسی غیرمجاز");
      setLoading(false);
      return;
    }

    const loadTicket = async () => {
      try {
        const [ticketDetails, messages] = await Promise.all([
          apiRequest<ApiTicketResponse>(`/api/tickets/${ticketId}`, { token }),
          apiRequest<ApiTicketMessageDto[]>(`/api/tickets/${ticketId}/messages`, { token }),
        ]);

        const mapped = mapApiTicketToUi(ticketDetails, categories, messages.map(mapApiMessageToResponse));
        setTicket(mapped);
      } catch (err: any) {
        console.error("Failed to load ticket:", err);
        setError(err?.message || "خطا در بارگذاری تیکت");
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [token, ticketId, categories]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg text-destructive">{error || "تیکت یافت نشد"}</p>
          <Button onClick={() => router.push("/")}>بازگشت به داشبورد</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            بازگشت به داشبورد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={statusColors[ticket.status]}>
                    {statusLabels[ticket.status] || ticket.status}
                  </Badge>
                  <Badge>{priorityLabels[ticket.priority] || ticket.priority}</Badge>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">شماره تیکت</p>
                <p className="font-mono text-lg">{ticket.id}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">توضیحات</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">دسته‌بندی:</span>
                <span className="text-sm font-medium">{ticket.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">تکنسین:</span>
                <span className="text-sm font-medium">{ticket.assignedTechnician || "اختصاص نیافته"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">تاریخ ایجاد:</span>
                <span className="text-sm font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">اولویت:</span>
                <span className="text-sm font-medium">{priorityLabels[ticket.priority] || ticket.priority}</span>
              </div>
            </div>

            {ticket.messages && ticket.messages.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    پیام‌ها ({ticket.messages.length})
                  </h3>
                  <div className="space-y-4">
                    {ticket.messages.map((message) => (
                      <Card key={message.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{message.authorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString("fa-IR")}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

