import Link from "next/link";

export default function CTA2() {
  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-[40px] bg-primary p-6 sm:p-10 md:p-20">
      <div className="absolute inset-0 hidden h-full w-full overflow-hidden md:block">
        <div className="absolute top-1/2 right-[-45%] aspect-square h-[800px] w-[800px] -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-[hsl(354_55%_75%)] opacity-30"></div>
          <div className="absolute inset-0 scale-[0.8] rounded-full bg-[hsl(354_45%_80%)] opacity-30"></div>
          <div className="absolute inset-0 scale-[0.6] rounded-full bg-[hsl(354_35%_85%)] opacity-30"></div>
          <div className="absolute inset-0 scale-[0.4] rounded-full bg-[hsl(354_25%_90%)] opacity-30"></div>
          <div className="absolute inset-0 scale-[0.2] rounded-full bg-[hsl(354_15%_95%)] opacity-30"></div>
          <div className="absolute inset-0 scale-[0.1] rounded-full bg-white/50 opacity-30"></div>
        </div>
      </div>

      <div className="relative z-10">
        <h1 className="mb-3 text-3xl font-bold text-primary-foreground sm:text-4xl md:mb-4 md:text-5xl">
         Welcome back ❤️
        </h1>
       

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/student/practice"
            className="flex w-full items-center justify-between rounded-full bg-[hsl(230_20%_12%)] px-5 py-3 text-white sm:w-[240px]"
          >
            <span className="font-medium">continue learning</span>
            <span className="h-5 w-5 flex-shrink-0 rounded-full bg-white"></span>
          </Link>
        </div>
      </div>
    </div>
  );
}
