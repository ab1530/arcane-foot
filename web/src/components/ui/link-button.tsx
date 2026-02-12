import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants> & {
    href: string;
    prefetch?: boolean;
  };

export function LinkButton({
  href,
  prefetch = true,
  className,
  children,
  variant,
  size,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
