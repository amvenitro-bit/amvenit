import React from "react";
import Link from "next/link";

type Props = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
};

export default function PageShell({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Înapoi",
  children,
}: Props) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 py-10">
      {/* Background grid ca în Hero */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 h-full w-full bg-hero-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      {/* fade jos, ca în Hero */}
      <div className="absolute left-0 right-0 bottom-0 backdrop-blur-[2px] h-40 -z-10 bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.25)] to-[rgba(202,208,230,0.25)]" />

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <Link href={backHref} className="text-orange-700 hover:text-orange-800 underline">
              ← {backLabel}
            </Link>
          </div>

          {title && (
            <h1 className="text-4xl md:text-6xl md:leading-tight font-bold text-foreground">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="mt-4 text-foreground/80 max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </main>
  );
}