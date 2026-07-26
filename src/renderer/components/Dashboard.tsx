import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useFinanceStore } from '../stores/useFinanceStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatCurrency, centsToDollars, type CurrencyCode } from '../../domain/money';

function formatMonthLabel(yearMonth: string): string {
  return format(parseISO(`${yearMonth}-01`), 'MMM yyyy');
}

interface ChartDatum {
  month: string;
  label: string;
  balance: number; // dollars
  net: number; // dollars
  balancePast: number | null;
  balanceFuture: number | null;
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || !payload.length) return null;
  const datum: ChartDatum = payload[0].payload;
  return (
    <div className="bg-surface border border-line-strong rounded-lg px-3.5 py-2.5 shadow-sm">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-ink font-semibold tabular-nums">{formatCurrency(datum.balance, currency)}</p>
      <p className={`text-xs tabular-nums ${datum.net >= 0 ? 'text-positive' : 'text-negative'}`}>
        {datum.net >= 0 ? '+' : ''}
        {formatCurrency(datum.net, currency)} net
      </p>
    </div>
  );
}

export default function Dashboard() {
  const timeline = useFinanceStore((s) => s.timeline);
  const entries = useFinanceStore((s) => s.entries);
  const currency = useSettingsStore((s) => s.currency) as CurrencyCode;

  const currentYearMonth = format(new Date(), 'yyyy-MM');

  const chartData: ChartDatum[] = useMemo(() => {
    return timeline.map((point, idx) => {
      const prev = timeline[idx - 1];
      const isBoundary = !!prev && !prev.isProjected && point.isProjected;
      const balanceDollars = centsToDollars(point.balance);
      return {
        month: point.month,
        label: formatMonthLabel(point.month),
        balance: balanceDollars,
        net: centsToDollars(point.net),
        balancePast: !point.isProjected || isBoundary ? balanceDollars : null,
        balanceFuture: point.isProjected || isBoundary ? balanceDollars : null,
      };
    });
  }, [timeline]);

  const currentPoint = timeline.find((p) => p.month === currentYearMonth);
  const netMonthlyDollars = centsToDollars(currentPoint ? currentPoint.net : 0);
  const projectedBalanceDollars = centsToDollars(
    timeline.length ? timeline[timeline.length - 1].balance : 0
  );

  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-line-strong rounded-lg py-20 text-center">
        <p className="text-sm text-muted">Add entries to see projections</p>
      </div>
    );
  }

  const todayLabel = chartData.find((d) => d.month === currentYearMonth)?.label;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px bg-line rounded-lg overflow-hidden border border-line">
        <div className="bg-surface p-6">
          <p className="text-xs font-medium tracking-wide text-muted uppercase mb-2">Net monthly</p>
          <p className={`text-2xl font-semibold tabular-nums ${netMonthlyDollars >= 0 ? 'text-positive' : 'text-negative'}`}>
            {formatCurrency(netMonthlyDollars, currency)}
          </p>
        </div>
        <div className="bg-surface p-6">
          <p className="text-xs font-medium tracking-wide text-muted uppercase mb-2">Projected balance</p>
          <p className={`text-2xl font-semibold tabular-nums ${projectedBalanceDollars >= 0 ? 'text-positive' : 'text-negative'}`}>
            {formatCurrency(projectedBalanceDollars, currency)}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-lg p-6">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="futureFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="#F4F4F5" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#A1A1AA"
              tick={{ fontSize: 11, fill: '#A1A1AA' }}
              tickLine={false}
              axisLine={{ stroke: '#E4E4E7' }}
              minTickGap={36}
            />
            <YAxis
              stroke="#A1A1AA"
              tick={{ fontSize: 11, fill: '#A1A1AA' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            {todayLabel && (
              <ReferenceLine
                x={todayLabel}
                stroke="#D4D4D8"
                strokeDasharray="3 3"
                label={{ value: 'Today', position: 'top', fill: '#A1A1AA', fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="balancePast"
              stroke="#2563EB"
              strokeWidth={1.75}
              fill="url(#pastFill)"
              connectNulls
              isAnimationActive={false}
              name="Balance"
            />
            <Area
              type="monotone"
              dataKey="balanceFuture"
              stroke="#93B4F5"
              strokeWidth={1.75}
              strokeDasharray="5 4"
              fill="url(#futureFill)"
              connectNulls
              isAnimationActive={false}
              name="Projected"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
