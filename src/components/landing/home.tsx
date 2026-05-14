import Link from "next/link";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  year: string;
  status: string;
}

const projects: Project[] = [
  {
    id: "01",
    title: "旅行规划助手",
    subtitle: "最省钱、最省假、最划算 —— 三种方案，挑一个就行。",
    href: "/travel",
    year: "2026",
    status: "在线",
  },
];

export function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-10 sm:px-10 sm:pt-14 lg:px-14">
        <nav className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.34em] text-stone-500">
          <span>chenmubai.cn</span>
          <span className="font-serif-italic normal-case tracking-normal text-stone-400">
            est. 2026
          </span>
        </nav>

        <header className="mt-24 sm:mt-36 lg:mt-44">
          <h1 className="font-serif-display text-[3.4rem] font-light leading-[0.92] tracking-tight text-stone-950 sm:text-[6rem] lg:text-[8rem]">
            陈慕白
          </h1>
          <p className="font-serif-display mt-8 max-w-2xl text-xl font-light leading-[1.55] text-stone-700 sm:text-2xl lg:text-[1.75rem]">
            业余时间做些
            <span className="font-serif-italic mx-1.5 text-stone-950">小工具</span>
            和
            <span className="font-serif-italic mx-1.5 text-stone-950">小想法</span>
            。
          </p>
        </header>

        <section className="mt-24 sm:mt-40 lg:mt-52">
          <div className="mb-6 flex items-baseline justify-between text-[11px] uppercase tracking-[0.34em] text-stone-500 sm:mb-10">
            <span>小工具</span>
            <span className="font-serif-italic normal-case tracking-normal text-stone-400">
              selected works
            </span>
          </div>

          <ul className="border-t border-stone-300/60">
            {projects.map((project) => (
              <li className="border-b border-stone-300/60" key={project.id}>
                <Link
                  className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-7 transition-colors sm:gap-10 sm:py-10"
                  href={project.href}
                >
                  <span className="font-serif-display w-10 text-sm text-stone-400 sm:text-base">
                    {project.id}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h2 className="font-serif-display text-3xl font-light leading-[1.05] text-stone-950 transition-transform duration-500 ease-out group-hover:translate-x-2 sm:text-5xl lg:text-[3.6rem]">
                        {project.title}
                      </h2>
                      <span className="font-serif-italic text-xs text-stone-400 sm:text-sm">
                        {project.year} · {project.status}
                      </span>
                    </div>
                    <p className="font-serif-display mt-3 max-w-xl text-sm font-light leading-relaxed text-stone-600 sm:mt-4 sm:text-base">
                      {project.subtitle}
                    </p>
                  </div>
                  <span className="self-center text-xl text-stone-400 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:text-stone-900 sm:text-2xl">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="font-serif-italic mt-10 text-sm text-stone-400 sm:mt-14 sm:text-base">
            更多想法陆续上线 ——
          </p>
        </section>

        <div className="flex-1" />

        <p className="font-serif-italic mt-16 text-[11px] uppercase tracking-[0.32em] text-stone-400 sm:mt-24">
          made slowly · in shanghai
        </p>
      </div>
    </main>
  );
}
