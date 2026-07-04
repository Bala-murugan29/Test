import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PassRateDonutChartProps {
  passed: number;
  failed: number;
}

export function PassRateDonutChart({ passed, failed }: PassRateDonutChartProps) {
  const total = passed + failed;
  const data = [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: failed },
  ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill="hsl(160 60% 45%)" />
            <Cell fill="hsl(0 72% 51%)" />
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
            formatter={(v: number) => [`${v} students`, '']}
          />
          <Legend
            formatter={(value) => <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: -20 }}>
          <span className="text-2xl font-bold text-foreground">{Math.round((passed / total) * 100)}%</span>
          <span className="text-xs text-muted-foreground">Pass Rate</span>
        </div>
      )}
    </div>
  );
}
