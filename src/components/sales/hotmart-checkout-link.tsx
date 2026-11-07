type HotmartCheckoutLinkProps = {
  href?: string;
  label: string;
};

export function HotmartCheckoutLink({ href, label }: HotmartCheckoutLinkProps) {
  if (!href) return null;

  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-4 py-2 text-sm font-bold text-foreground transition hover:border-foreground/50 hover:bg-foreground/5"
    >
      {label}
    </a>
  );
}
