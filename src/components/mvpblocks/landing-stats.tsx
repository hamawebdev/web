"use client";

import { motion } from "framer-motion";

const stats = [
    {
        value: "+10",
        label: "Universities",
    },
    {
        value: "+150k",
        label: "Questions",
    },
    {
        value: "+10k",
        label: "Resources",
    },
];

export default function LandingStats() {
    return (
        <section className="w-full py-12 md:py-16 bg-background border-y border-border/40">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center justify-center space-y-2"
                        >
                            <h3 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
                                {stat.value}
                            </h3>
                            <p className="text-lg text-muted-foreground font-medium uppercase tracking-wide">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
