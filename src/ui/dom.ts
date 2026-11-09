/** Fail at startup if the HTML no longer matches a component's typed contract. */
export function element<T extends HTMLElement>(
  root: ParentNode,
  id: string,
  type: { new (): T },
): T {
  const node = root.querySelector(`#${id}`);
  if (!(node instanceof type))
    throw new Error(`Missing or invalid element: ${id}`);
  return node;
}
