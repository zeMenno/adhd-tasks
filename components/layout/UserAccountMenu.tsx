"use client";

import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";
import { ResetPinDialog } from "@/components/layout/ResetPinDialog";

function submitLogout() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/logout";
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

type Props = {
  userName: string;
};

export function UserAccountMenu({ userName }: Props) {
  const [resetPinOpen, setResetPinOpen] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className={cn(
            "-m-0.5 max-w-[min(160px,45vw)] shrink-0 truncate rounded px-0.5 py-0.5 text-left text-sm font-semibold text-slate-700",
            "border-0 bg-transparent shadow-none outline-none ring-slate-400/50 hover:text-slate-900",
            "focus-visible:ring-2 data-popup-open:text-slate-900"
          )}
        >
          {userName}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            className="outline-none"
            side="bottom"
            align="end"
            sideOffset={4}
            positionMethod="fixed"
          >
            <Menu.Popup
              className={cn(
                "z-50 min-w-[11rem] origin-[var(--transform-origin)] rounded-lg bg-popover py-1 text-sm text-popover-foreground shadow-md ring-1 ring-border",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
              )}
            >
              <Menu.Item
                className={cn(
                  "cursor-pointer px-3 py-2 text-slate-700 outline-none select-none",
                  "data-highlighted:bg-slate-100 data-highlighted:text-slate-900"
                )}
                onClick={() => setResetPinOpen(true)}
              >
                PIN wijzigen
              </Menu.Item>
              <Menu.Item
                className={cn(
                  "cursor-pointer px-3 py-2 text-slate-700 outline-none select-none",
                  "data-highlighted:bg-slate-100 data-highlighted:text-slate-900"
                )}
                onClick={submitLogout}
              >
                Uitloggen
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <ResetPinDialog open={resetPinOpen} onOpenChange={setResetPinOpen} />
    </>
  );
}
