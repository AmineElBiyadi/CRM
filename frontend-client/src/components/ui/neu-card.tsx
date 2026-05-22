import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface NeuCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  pressable?: boolean;
}

export function NeuCard({ children, size = "md", pressable, className, ...props }: NeuCardProps) {
  const sizeCls = size === "sm" ? "neu-sm p-4" : size === "lg" ? "neu-lg p-8" : "neu p-6";
  return (
    <div className={cn(sizeCls, pressable && "neu-pressable cursor-pointer", className)} {...props}>
      {children}
    </div>
  );
}
