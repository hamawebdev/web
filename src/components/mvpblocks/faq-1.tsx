import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion';

const items = [
  {
    id: '1',
    title: "How does MedADN personalize my learning experience?",
    content:
      "Our platform analyzes your performance patterns, learning speed, and gaps to create a personalized study plan. It adapts based on your progress and focuses on areas where you need the most improvement.",
  },
  {
    id: '2',
    title: "What makes MedADN different from other medical platforms?",
    content:
      "MedADN combines evidence-based medical education with expert-curated content. Our materials are developed by healthcare professionals, our analytics provide deep insights, and our collaborative features connect you with your peers.",
  },
  {
    id: '3',
    title: "Can I access MedADN on mobile devices?",
    content:
      "Yes! MedADN is fully optimized for mobile devices. You can study on the go, access your progress anywhere, and sync your data across all your devices seamlessly.",
  },
  {
    id: '4',
    title: "Do you offer support for medical licensing exams?",
    content:
      "Absolutely! We have specialized modules for regional and national medical exams. Our exam prep tools include practice tests, performance analytics, and expert tips.",
  },
  {
    id: '5',
    title: "Is there a free trial available?",
    content:
      "Yes, we offer a trial period for all new users. This gives you full access to explore our platform, try different features, and see how MedADN can enhance your medical education.",
  },
  {
    id: '6',
    title: "How often is the content updated?",
    content:
      "Our content is continuously updated by our team of healthcare professionals and educators. We ensure that all information reflects the latest medical research and clinical guidelines.",
  },
];

const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
      duration: 0.4,
    },
  }),
};

export default function Faq1() {
  return (
    <section id="faq" className="py-12 md:py-24 bg-background">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <motion.h2
            className="mb-4 text-4xl font-bold tracking-tight md:text-5xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-primary to-[hsl(38_55%_68%)] bg-clip-text text-transparent">
              Questions
            </span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground mx-auto max-w-2xl text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything you need to know about MedADN and how we are transforming your medical study journey.
          </motion.p>
        </div>

        <motion.div
          className="relative mx-auto max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Decorative gradient */}
          <div className="bg-primary/5 absolute -top-12 -left-12 -z-10 h-72 w-72 rounded-full blur-3xl opacity-50" />
          <div className="bg-primary/5 absolute -right-12 -bottom-12 -z-10 h-72 w-72 rounded-full blur-3xl opacity-50" />

          <Accordion
            type="single"
            collapsible
            className="border-border grid gap-4 w-full rounded-2xl border p-4 bg-background/50 backdrop-blur-md shadow-sm"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={fadeInAnimationVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={item.id}
                  className={cn(
                    'bg-card/30 my-0 overflow-hidden rounded-xl border border-border/50 px-4 transition-all duration-300',
                    'data-[state=open]:bg-card/70 data-[state=open]:border-primary/20 data-[state=open]:shadow-md',
                    'hover:border-primary/20 hover:bg-card/50'
                  )}
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        'group flex flex-1 items-center justify-between gap-4 py-5 text-left text-lg font-semibold',
                        'hover:text-primary transition-all duration-300 outline-none',
                        'focus-visible:ring-primary/50 focus-visible:ring-2',
                        'data-[state=open]:text-primary',
                      )}
                    >
                      {item.title}
                      <PlusIcon
                        size={20}
                        className={cn(
                          'text-primary/70 shrink-0 transition-transform duration-500 ease-in-out',
                          'group-data-[state=open]:rotate-45',
                        )}
                        aria-hidden="true"
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionContent
                    className={cn(
                      'text-muted-foreground overflow-hidden pt-0 pb-6 text-base leading-relaxed',
                      'data-[state=open]:animate-accordion-down',
                      'data-[state=closed]:animate-accordion-up',
                    )}
                  >
                    <div className="border-border/20 border-t pt-4">
                      {item.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
