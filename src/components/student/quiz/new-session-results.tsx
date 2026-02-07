import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewSessionResultsProps {
    data: {
        correctAnswersCount: number;
        incorrectAnswersCount: number;
        unansweredCount: number;
        totalScore20: number;
    };
}

export function NewSessionResults({ data }: NewSessionResultsProps) {
    const chartData = useMemo(() => [
        { name: 'Correct', value: data.correctAnswersCount, color: 'var(--color-success)', icon: CheckCircle },
        { name: 'Incorrect', value: data.incorrectAnswersCount, color: 'var(--color-destructive)', icon: XCircle },
        { name: 'Unanswered', value: data.unansweredCount, color: 'var(--color-muted)', icon: HelpCircle },
    ].filter(item => item.value > 0), [data]);

    const totalQuestions = data.correctAnswersCount + data.incorrectAnswersCount + data.unansweredCount;

    // Custom colors for the chart
    const COLORS = {
        Correct: '#22c55e',    // Green-500
        Incorrect: '#ef4444',  // Red-500
        Unanswered: '#94a3b8'  // Slate-400
    };

    return (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-center">Session Results</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-8">

                {/* Main Score Display */}
                <div className="relative flex items-center justify-center">
                    <div className="h-64 w-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    strokeWidth={0}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[entry.name as keyof typeof COLORS]}
                                            className="stroke-background hover:opacity-80 transition-opacity"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Center Score Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Score</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-foreground">
                                {typeof data.totalScore20 === 'number' ? data.totalScore20.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-lg text-muted-foreground font-semibold">/ 20</span>
                        </div>
                    </div>
                </div>

                {/* Stats Legend */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    {[
                        {
                            label: 'Correct',
                            count: data.correctAnswersCount,
                            color: 'text-green-500',
                            bg: 'bg-green-500/10',
                            icon: CheckCircle
                        },
                        {
                            label: 'Incorrect',
                            count: data.incorrectAnswersCount,
                            color: 'text-red-500',
                            bg: 'bg-red-500/10',
                            icon: XCircle
                        },
                        {
                            label: 'Unanswered',
                            count: data.unansweredCount,
                            color: 'text-slate-500',
                            bg: 'bg-slate-500/10',
                            icon: HelpCircle
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border shadow-sm transition-transform hover:scale-105"
                        >
                            <stat.icon className={cn("w-6 h-6 mb-2", stat.color)} />
                            <div className="text-2xl font-bold">{stat.count}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>

            </CardContent>
        </Card>
    );
}
