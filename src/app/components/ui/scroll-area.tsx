"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "./utils";

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportRef?: React.RefObject<HTMLDivElement>;
};

function ScrollArea({
  className,
  children,
  viewportRef,
  ...props
}: ScrollAreaProps) {
  const localVpRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const vp = localVpRef.current;
    if (!vp) return;
    // Ensure horizontal scrolling is enabled at runtime (important when Radix sets inline styles)
    vp.style.overflowX = 'auto';
    vp.style.overflowY = 'hidden';
    vp.style.width = '100%';
    vp.style.minWidth = '0';
    vp.style.boxSizing = 'border-box';
    // Make inner container lay out horizontally
    const firstChild = vp.firstElementChild as HTMLElement | null;
    if (firstChild) {
      firstChild.style.display = 'flex';
      firstChild.style.alignItems = 'center';
      firstChild.style.gap = '0.25rem';
      firstChild.style.minWidth = '100%';
    }
    // forward to caller ref if provided
    if (viewportRef && 'current' in viewportRef) {
      (viewportRef as React.RefObject<HTMLDivElement>).current = vp;
    }
    // ensure the root element (parentNode of viewport) can shrink/grow in flex layouts
    const rootEl = vp.parentElement;
    if (rootEl) {
      (rootEl as HTMLElement).style.minWidth = '0';
    }
  }, [viewportRef]);
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        ref={localVpRef}
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
