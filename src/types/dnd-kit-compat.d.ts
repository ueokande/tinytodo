import type { JSX as ReactJSX } from "react";

// Stable dnd-kit declarations still reference the pre-React-19 JSX.Element name.
// Preserve strict checking by mapping those names to React's current type.
declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}
