import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonStyles = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      tone: {
        solid: "bg-bone text-ink hover:bg-accent",
        ghost: "border border-line bg-transparent text-bone hover:border-accent",
        quiet: "bg-transparent text-muted hover:text-bone",
      },
    },
    defaultVariants: { tone: "ghost" },
  },
);

export function Button({
  className,
  tone,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ tone }), className)} {...props} />;
}
