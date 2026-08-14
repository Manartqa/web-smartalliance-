import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { INPUT_BASE_CLASS } from "./Input.config";

type BaseTextareaProps = ComponentProps<"textarea">;

export default function BaseTextarea({
  className,
  ...rest
}: BaseTextareaProps) {
  return <textarea className={cn(INPUT_BASE_CLASS, className)} {...rest} />;
}
