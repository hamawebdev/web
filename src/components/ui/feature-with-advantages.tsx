import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const characteristics = [
  {
    title: 'Premium Question Bank',
    description: '100,000+ medical questions aligned with the Medical School curriculum.',
  },
  {
    title: 'Smart Organization',
    description: 'Content structured by modules, courses, and study years for targeted learning.',
  },
  {
    title: 'Certified Content',
    description: 'Questions validated by medical experts according to international standards.',
  },
  {
    title: 'Continuous Evolution',
    description: 'A dynamic platform constantly enriched to stay at the cutting edge of innovation.',
  },
  {
    title: 'Detailed Explanations',
    description: 'Corrections enriched with anatomical diagrams and medical imaging.',
  },
  {
    title: 'Learning Intelligence',
    description: 'Advanced analytics to transform your data into actionable insights.',
  },
];

function Feature() {
  return (
    <section id="features" className="w-full py-12 sm:py-16 lg:py-20 xl:py-32 bg-background text-foreground px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex gap-6 sm:gap-8 lg:gap-10 py-8 sm:py-10 lg:py-14 xl:py-16 flex-col items-center text-center">
          <div>
            <Badge variant="outline" className="border-primary/20 text-primary text-xs sm:text-sm">Features</Badge>
          </div>
          <div className="flex gap-3 sm:gap-4 flex-col w-full max-w-lg sm:max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl tracking-tighter font-bold">
              Why Choose MedADN?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg max-w-full sm:max-w-xl leading-relaxed tracking-tight text-muted-foreground mx-auto">
              A platform designed by doctors for future doctors, combining scientific rigor and cutting-edge technology.
            </p>
          </div>
          <div className="flex gap-8 sm:gap-10 pt-8 sm:pt-10 lg:pt-12 flex-col w-full text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {characteristics.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full items-start group p-4 sm:p-0">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-base sm:text-lg lg:text-xl">{item.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Feature };
