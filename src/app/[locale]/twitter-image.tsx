/**
 * X/Twitter needs its own file convention — it does not fall back to
 * `opengraph-image`. Same card, so this re-exports rather than duplicating it.
 */
export {
  default,
  alt,
  size,
  contentType,
  generateStaticParams,
} from "./opengraph-image";
