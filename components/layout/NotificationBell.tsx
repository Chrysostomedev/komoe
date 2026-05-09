"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, CheckCircle2, MessageSquare, AlertCircle, Info } from "lucide-react";
import { notificationsApi, type AppNotification } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/Popover";
import { formatDateShort, stripHtml } from "@/lib/constants";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.list();
      const notifs: AppNotification[] = Array.isArray(data) ? data : (data as any)?.results || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Erreur chargement notifs:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // SSE Stream
      const streamUrl = notificationsApi.getStreamUrl();
      const eventSource = new EventSource(streamUrl, { withCredentials: true });
      
      eventSource.onmessage = (event) => {
        const newNotif = JSON.parse(event.data);
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Toast logic could go here
      };

      return () => eventSource.close();
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async () => {
    try {
      await notificationsApi.marquerLues();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erreur marquage lues:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "TRANSACTION": return <CheckCircle2 className="text-emerald-500 w-4 h-4" />;
      case "SIGNALEMENT": return <AlertCircle className="text-rose-500 w-4 h-4" />;
      case "PROPOSITION": return <MessageSquare className="text-primary w-4 h-4" />;
      default: return <Info className="text-blue-500 w-4 h-4" />;
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/50">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-600/20">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-[24px] border-border bg-card shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground italic">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAsRead}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 flex gap-3 hover:bg-muted/20 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                  <div className="mt-1 shrink-0">{getIcon(n.type_notif)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-xs font-bold leading-tight ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.titre}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{stripHtml(n.message)}</p>
                    <p className="text-[9px] font-medium text-muted-foreground opacity-50 uppercase">{formatDateShort(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border bg-muted/10 text-center">
          <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Voir tout l'historique
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
