/** Keep the composer above keyboards that resize only the visual viewport. */
export function positionComposer(composer: HTMLElement): void {
  const viewport = window.visualViewport;
  const style = document.documentElement.style;
  const updatePosition = () => {
    const bottom = viewport
      ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      : 0;
    style.setProperty("--viewport-bottom", `${bottom}px`);
  };
  const updateHeight = () => {
    style.setProperty(
      "--composer-height",
      `${composer.getBoundingClientRect().height}px`,
    );
  };
  viewport?.addEventListener("resize", updatePosition);
  viewport?.addEventListener("scroll", updatePosition);
  window.addEventListener("resize", updatePosition);
  new ResizeObserver(updateHeight).observe(composer);
  updatePosition();
  updateHeight();
}
