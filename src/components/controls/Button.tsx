import type { ComponentProps } from "react";
import styles from "./Button.module.css";

interface Props extends ComponentProps<"button"> {
  variant?: "plain" | "primary" | "danger";
}
export function Button({
  variant = "plain",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
    />
  );
}
