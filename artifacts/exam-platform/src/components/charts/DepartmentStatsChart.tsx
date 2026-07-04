import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DepartmentStats } from '@/types';

interface DepartmentStatsChartProps {
  data: DepartmentStats[];
}

const COLORS = [
  'hsl(233 57% 50%)',
  'hsl(160 60% 45%)',
  'hsl(43 90% 55%)',
  'hsl(340 75% 55%)',
  'hsl(25 80% 55%)',
];

export function DepartmentStatsChart({ data }: DepartmentStatsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="%" />
        <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
          formatter={(value: number) => [`${value}%`, 'Pass Rate']}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
        />
        <Bar dataKey="passRate" name="Pass Rate" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
