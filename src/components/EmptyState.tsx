import type { ReactNode } from "react";

export function EmptyState({
  image,
  title,
  body,
  action,
}: {
  image: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <img src={image} alt="" className="w-full max-w-[280px] rounded-3xl mb-5 object-cover" />
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/60 max-w-sm">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
