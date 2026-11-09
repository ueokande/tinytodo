import type { ReactNode } from "react";
import styles from "./AppLayout.module.css";

interface Props {
  header: ReactNode;
  children: ReactNode;
  composer: ReactNode;
  feedback: ReactNode;
  overlay?: ReactNode;
}
/** Page geometry only: features own content, state, and interaction. */
export function AppLayout({
  header,
  children,
  composer,
  feedback,
  overlay,
}: Props) {
  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>{header}</header>
        {children}
      </main>
      {composer}
      {feedback}
      {overlay}
    </>
  );
}
