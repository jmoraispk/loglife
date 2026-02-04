// Force dynamic rendering for authenticated pages
export const dynamic = "force-dynamic";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
