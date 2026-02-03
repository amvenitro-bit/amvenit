import InregistrareClient from "./InregistrareClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next =
    typeof searchParams?.next === "string" && searchParams.next.length > 0
      ? searchParams.next
      : "/";

  return <InregistrareClient next={next} />;
}