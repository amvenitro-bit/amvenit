import ConectareClient from "./ConectareClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next =
    typeof searchParams?.next === "string" && searchParams.next.length > 0
      ? searchParams.next
      : "/";

  return <ConectareClient next={next} />;
}