import ConectareClient from "./ConectareClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp?.next === "string" && sp.next.length > 0 ? sp.next : "/";
  return <ConectareClient next={next} />;
}