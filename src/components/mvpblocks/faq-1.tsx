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
    title: "What are the available payment methods to purchase a Med-Adn subscription?",
    content:
      "The Med-Adn platform offers the following 3 payment methods:\n• Payment by CCP (postal checking account)\n• Payment via the BaridiMob application\n• Purchase of an activation card from our points of sale",
  },
  {
    id: '2',
    title: "How to get the latest updates on Med-Adn?",
    content:
      "Our team works daily to update the content of our Med-Adn platform throughout the academic year:\n• The course list will be updated according to the new official program.\n• Current year exam questions will be added, corrected, commented on, and organized by course, year, and exam period.\n• Don't worry! All updates will be automatically and freely included in your subscription.",
  },
  {
    id: '3',
    title: "What is the content of the Med-Adn platform?",
    content:
      "Med-Adn is an exercise and training platform aligned with the Algerian Faculty of Medicine program.\n\nIt includes all questions from externship exams (MCQs, QROCs, Clinical Cases) and residency exams (since 2002) as well as other international sources.\n\nEverything is organized by course, modules, as well as midterm exams (EMDs) and exam questions to give students the freedom to choose the revision method that suits them best.\n\nCourse titles are organized in the same way as the official faculty program, and questions are displayed in reverse chronological order. For each question, the exact date and exam period from which it was taken are indicated.",
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
