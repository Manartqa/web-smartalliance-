/**
 * Renders a JSON-LD block.
 *
 * `</` inside any string value would close the `<script>` element early and
 * hand the rest of the payload to the HTML parser, so the escape below is a
 * hard requirement rather than a precaution — company details are static, but
 * translated copy flows through here too.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
