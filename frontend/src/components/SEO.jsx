import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, path = '/' }) {
  const fullTitle = title ? `${title} | GO SCHEME` : 'GO SCHEME | Government Scheme Discovery Portal';
  const desc = description || "Find every Tamil Nadu and Central Government scheme you're eligible for, organized sector by sector.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={`https://goscheme.example.in${path}`} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={`https://goscheme.example.in${path}`} />
    </Helmet>
  );
}
