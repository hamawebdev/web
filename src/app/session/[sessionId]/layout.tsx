// The session pages are client-rendered shells: the HTML does not depend on the
// session id. An empty list here lets Next.js render each session URL once and
// then serve it from cache, instead of rendering it on the server on every visit.
export function generateStaticParams() {
  return [];
}

export default function SessionIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
