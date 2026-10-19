import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * بديل موحّد لنافذة `confirm()` الخاصة بالمتصفح.
 * يعرض تنبيهًا من النظام (AlertDialog) بنفس هوية النظام.
 *
 * الاستخدام:
 *   const { confirm, confirmDialog } = useConfirmDialog();
 *   ...
 *   if (!(await confirm({ description: "هل أنت متأكد؟" }))) return;
 *   ...
 *   return (<> ... {confirmDialog} </>);
 */
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts?: ConfirmOptions | string) => {
    const normalized: ConfirmOptions =
      typeof opts === "string" ? { description: opts } : opts ?? {};
    setOptions(normalized);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = useCallback((value: boolean) => {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  const isDestructive = options.destructive !== false;

  const confirmDialog = (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish(false);
      }}
    >
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                isDestructive ? "text-destructive" : "text-amber-500"
              )}
            />
            {options.title ?? "تأكيد العملية"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{options.description ?? "هل أنت متأكد من المتابعة؟"}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => finish(false)}>
            {options.cancelLabel ?? "إلغاء"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              isDestructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
            onClick={(event) => {
              event.preventDefault();
              finish(true);
            }}
          >
            {options.confirmLabel ?? "تأكيد"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}
