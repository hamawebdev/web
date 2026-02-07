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
    <section id="features" className="w-full py-20 lg:py-40 bg-background text-foreground">
      <div className="container mx-auto">
        <div className="flex gap-4 py-10 lg:py-20 flex-col items-start lg:items-center lg:text-center">
          <div>
            <Badge variant="outline" className="border-primary/20 text-primary">Features</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-bold mx-auto">
              Why Choose MedADN?
            </h2>
            <p className="text-lg max-w-xl lg:max-w-2xl leading-relaxed tracking-tight text-muted-foreground mx-auto">
              A platform designed by doctors for future doctors, combining scientific rigor and cutting-edge technology.
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full text-left">
            <div className="grid grid-cols-1 items-start md:grid-cols-2 lg:grid-cols-3 gap-10">
              {characteristics.map((item, index) => (
                <div key={index} className="flex flex-row gap-6 w-full items-start group">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-xl">{item.title}</p>
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
