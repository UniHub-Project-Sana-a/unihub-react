import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TabErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center border rounded-xl bg-card my-6 space-y-4 max-w-md mx-auto shadow-xs" dir="rtl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {this.props.fallbackTitle || "تعذر تحميل هذا التبويب"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              يبدو أنه تم تحديث النظام للتو، أو حدث انقطاع أثناء تحميل ملفات هذه الواجهة. يرجى النقر أدناه لإعادة تحميل الصفحة وتنزيل التحديثات.
            </p>
          </div>
          <Button onClick={this.handleReload} size="sm" className="gap-2 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة تحميل الصفحة وتحديث الواجهة</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

