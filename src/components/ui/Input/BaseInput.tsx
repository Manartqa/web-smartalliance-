import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { INPUT_BASE_CLASS } from "./Input.config";

type BaseInputProps = ComponentProps<"input">;

export default function BaseInput({ className, ...rest }: BaseInputProps) {
  return <input className={cn(INPUT_BASE_CLASS, className)} {...rest} />;
}
