import { Helmet } from "react-helmet-async";

const DEFAULT_DESC =
  "FactStamp helps Indians verify viral WhatsApp forwards with transparent, community-driven fact-checks and clear verdicts.";

export default function Seo({ title, description = DEFAULT_DESC }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="FactStamp" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="/og-cover.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="/og-cover.png" />
    </Helmet>
  );
}
