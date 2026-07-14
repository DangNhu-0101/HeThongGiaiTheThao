import type React from "react";
import heroImage from "@/assets/hero.png";

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
    <section className="relative isolate overflow-hidden bg-header text-white">
      <img src={imageSrc} alt={imageAlt} className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(7,27,46,0.84)_0%,rgba(11,39,66,0.74)_52%,rgba(11,39,66,0.54)_100%)]" />
      <div className="page-shell grid min-h-[calc(100dvh-4.75rem)] gap-10 py-16 md:min-h-[42rem] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
        <div className="fade-up max-w-4xl">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase text-white ring-1 ring-white/15">
            {eyebrow}
          </span>
          <h1 className="mt-5 text-[clamp(2.625rem,6vw,4.5rem)] font-extrabold leading-[1.08]">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-base font-normal leading-8 text-white/78 sm:text-lg">{description}</p>}
        </div>

        {(stats?.length || children) && (
          <div className="fade-up rounded-2xl border border-white/18 bg-white/12 p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-6">
            {children || (
              <div className="grid grid-cols-2 gap-3">
                {stats?.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/12 bg-white/10 p-4">
                    <div className="text-3xl font-extrabold">{Number(item.value).toLocaleString("vi-VN")}</div>
                    <p className="mt-1 text-sm font-bold text-white">{item.label}</p>
                    {item.description && <p className="text-xs font-medium leading-5 text-white/68">{item.description}</p>}
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
