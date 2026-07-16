import type React from "react";
import heroImage from "@/assets/spectator.png";

interface PublicHeroStat {
  value: string | number;
  label: string;
  description?: string;
}

interface PublicHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt: string;
  stats?: PublicHeroStat[];
  children?: React.ReactNode;
}

const PublicHero = ({ eyebrow, title, description, imageSrc = heroImage, imageAlt, stats, children }: PublicHeroProps) => {
  return (
    <section className="relative isolate overflow-hidden bg-[#d9efff] text-primary-dark">
      <img src={imageSrc} alt={imageAlt} className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-[#47B0FF]/30" />
      <div className="absolute inset-0 -z-10 bg-white/34" />
      <div className="page-shell grid min-h-[25rem] gap-10 py-14 sm:min-h-[29rem] md:min-h-[33rem] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
        <div className="fade-up max-w-4xl">
          <span className="inline-flex rounded-full bg-primary-dark/10 px-3 py-1.5 font-highlight text-xs font-medium uppercase tracking-wide text-primary-dark ring-1 ring-primary-dark/15">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-heading text-[clamp(2.25rem,6vw,4.25rem)] font-bold leading-[1.08] text-primary-dark">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-primary-dark/80 sm:text-lg">{description}</p>}
        </div>

        {(stats?.length || children) && (
          <div className="fade-up rounded-xl border border-white/55 bg-white/55 p-5 shadow-[var(--shadow-panel)] backdrop-blur-md sm:p-6">
            {children || (
              <div className="grid grid-cols-2 gap-3">
                {stats?.map((item) => (
                  <div key={item.label} className="rounded-lg border border-primary-dark/10 bg-white/62 p-4">
                    <div className="font-highlight text-3xl font-semibold text-accent">{Number(item.value).toLocaleString("vi-VN")}</div>
                    <p className="mt-1 text-sm font-bold text-primary-dark">{item.label}</p>
                    {item.description && <p className="text-xs font-medium leading-5 text-primary-dark/65">{item.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicHero;
