'use client';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  if (!data.length) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 100 / data.length;
  
  return (
    <div className="relative" style={{ height }}>
      <div className="absolute inset-0 flex items-end justify-around gap-2">
        {data.map((item, i) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600">{item.value}</span>
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: item.color || '#2563eb',
                  minHeight: item.value > 0 ? '4px' : '0',
                }}
              />
              <span className="text-xs text-slate-500 truncate max-w-full">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 150 }: DonutChartProps) {
  if (!data.length) return null;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {data.map((item, i) => {
          const percentage = (item.value / total) * 100;
          const segmentLength = (percentage / 100) * circumference;
          const segment = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="20"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              className="transition-all"
            />
          );
          offset += segmentLength;
          return segment;
        })}
      </svg>
      <div className="space-y-1">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600">{item.label}</span>
            <span className="text-slate-800 font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatsChartProps {
  inventoriesByStatus: { planned: number; completed: number; cancelled: number };
  inventoriesByMonth: { label: string; value: number }[];
}

export function DashboardCharts({ inventoriesByStatus, inventoriesByMonth }: StatsChartProps) {
  const statusData = [
    { label: 'Planificados', value: inventoriesByStatus.planned, color: '#3b82f6' },
    { label: 'Completados', value: inventoriesByStatus.completed, color: '#22c55e' },
    { label: 'Cancelados', value: inventoriesByStatus.cancelled, color: '#ef4444' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 mb-4">Inventarios por estado</h3>
        <DonutChart data={statusData} />
      </div>
      
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 mb-4">Inventarios por mes</h3>
        <BarChart data={inventoriesByMonth} height={150} />
      </div>
    </div>
  );
}