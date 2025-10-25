"use client";
import * as React from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";

const ScrollAreaPrimitive = React.forwardRef<
  React.ElementRef<typeof ScrollArea>,
  React.ComponentPropsWithoutRef<typeof ScrollArea>
>(({ className, children, ...props }, ref) => (
  <ScrollArea
    ref={ref}
    className={className}
    {...props}
  >
    {children}
  </ScrollArea>
));
ScrollAreaPrimitive.displayName = "ScrollArea";

export { ScrollAreaPrimitive as ScrollArea };
