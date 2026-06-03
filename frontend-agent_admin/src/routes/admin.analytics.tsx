import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NeuCard } from "@/components/ui/neu-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminAnalytics, type AdminAnalyticsDto, type AdminAnalyticsMonthDto, type AdminAnalyticsPeriodType } from "@/api/adminDashboardApi";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FileDown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

const FUNNEL_COLORS: Record<string, string> = {
  alice: "bg-alice",
  honeydew: "bg-honeydew",
  vanilla: "bg-vanilla",
  accent: "bg-[oklch(0.82_0.1_55)]",
  success: "bg-[oklch(0.75_0.12_145)]",
};

const SOURCE_COLORS: Record<string, string> = {
  alice: "bg-alice",
  honeydew: "bg-honeydew",
  vanilla: "bg-vanilla",
  muted: "bg-muted",
};

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatMonthYear(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function ConversionChart({ data }: { data: AdminAnalyticsMonthDto[] }) {
  const values = data.map((m) => m.conversionRatePercent);
  const max = Math.max(25, ...values, 1);
  const w = 500;
  const h = 180;
  const pad = 20;

  if (values.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée disponible.</p>;
  }

  const points = values.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / Math.max(values.length - 1, 1);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return [x, y] as const;
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  const compactLabels = data.length > 8;

  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
      <defs>
        <linearGradient id="analytics-conversion-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.89 0.015 252)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.89 0.015 252)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#analytics-conversion-fill)" />
      <path d={path} fill="none" stroke="oklch(0.24 0 0)" strokeWidth={2.5} strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <g key={`${data[i].label}-${i}`}>
          <circle cx={x} cy={y} r={4} fill="oklch(0.94 0.085 105)" stroke="oklch(0.24 0 0)" strokeWidth={2} />
          <text
            x={x}
            y={h + 15}
            textAnchor="middle"
            fontSize={compactLabels ? "8" : "10"}
            fill="oklch(0.45 0.015 270)"
          >
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Funnel({ stages }: { stages: AdminAnalyticsDto["funnel"] }) {
  if (stages.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aucun dossier dans le pipeline.</p>;
  }

  const max = Math.max(stages[0]?.value ?? 1, 1);

  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-20 text-xs text-muted-foreground">{s.label}</span>
          <div className="flex-1 h-9 neu-inset rounded-lg overflow-hidden">
            <div
              className={`h-full ${FUNNEL_COLORS[s.colorKey] ?? "bg-alice"} flex items-center justify-end pr-3 text-xs font-semibold text-eerie transition-all`}
              style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 8 : 0)}%` }}
            >
              {s.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: AdminAnalyticsPeriodType;
  onChange: (value: AdminAnalyticsPeriodType) => void;
}) {
  return (
    <div className="flex rounded-xl neu-sm p-1 bg-ghost">
      {(["year", "month"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            value === option ? "bg-eerie text-ghost" : "text-muted-foreground hover:text-eerie",
          )}
        >
          {option === "year" ? "Année" : "Mois"}
        </button>
      ))}
    </div>
  );
}

function PeriodNavigator({
  periodType,
  year,
  month,
  availableYears,
  onYearChange,
  onMonthChange,
}: {
  periodType: AdminAnalyticsPeriodType;
  year: number;
  month: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const minYear = availableYears.length > 0 ? Math.min(...availableYears) : currentYear;
  const maxYear = availableYears.length > 0 ? Math.max(...availableYears) : currentYear;

  const canGoPrevYear = year > minYear;
  const canGoNextYear = year < maxYear;

  const canGoPrevMonth = year > minYear || month > 1;
  const canGoNextMonth =
    year < currentYear || (year === currentYear && month < currentMonth);

  function shiftMonth(delta: number) {
    let nextYear = year;
    let nextMonth = month + delta;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    if (nextYear < minYear) return;
    if (nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth)) return;
    onMonthChange(nextYear, nextMonth);
  }

  if (periodType === "year") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canGoPrevYear}
          onClick={() => onYearChange(year - 1)}
          className="w-8 h-8 rounded-lg neu-sm flex items-center justify-center disabled:opacity-40"
          aria-label="Année précédente"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[4.5rem] text-center text-sm font-semibold">{year}</span>
        <button
          type="button"
          disabled={!canGoNextYear}
          onClick={() => onYearChange(year + 1)}
          className="w-8 h-8 rounded-lg neu-sm flex items-center justify-center disabled:opacity-40"
          aria-label="Année suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={!canGoPrevMonth}
        onClick={() => shiftMonth(-1)}
        className="w-8 h-8 rounded-lg neu-sm flex items-center justify-center disabled:opacity-40"
        aria-label="Mois précédent"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[8rem] text-center text-sm font-semibold capitalize">
        {formatMonthYear(year, month)}
      </span>
      <button
        type="button"
        disabled={!canGoNextMonth}
        onClick={() => shiftMonth(1)}
        className="w-8 h-8 rounded-lg neu-sm flex items-center justify-center disabled:opacity-40"
        aria-label="Mois suivant"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const now = new Date();
  const [periodType, setPeriodType] = useState<AdminAnalyticsPeriodType>("year");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const queryParams = useMemo(
    () => ({
      periodType,
      year,
      ...(periodType === "month" ? { month } : {}),
    }),
    [periodType, year, month],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["admin-analytics", queryParams],
    queryFn: () => fetchAdminAnalytics(queryParams),
    staleTime: 60_000,
  });

  const availableYears = data?.availableYears ?? [now.getFullYear()];

  if (isLoading && !data) return <AnalyticsLoading />;

  if (isError || !data) {
    return (
      <NeuCard className="p-8 text-center max-w-lg mx-auto">
        <ShieldAlert className="mx-auto mb-3 text-destructive" size={28} />
        <p className="font-medium">Analytique indisponible</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof ApiError
            ? error.details ?? error.message
            : error instanceof Error
              ? error.message
              : "Erreur de chargement"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-xl bg-eerie text-ghost text-sm"
        >
          Réessayer
        </button>
      </NeuCard>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytique & rapports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Données en temps réel · santé commerciale de l&apos;agence
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.success("Export PDF généré (3.2 MB)")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <FileDown size={16} /> Exporter PDF
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <NeuCard className={cn(isFetching && "opacity-80 transition-opacity")}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold">{data.conversionTitle}</h2>
              <span className="text-xs text-muted-foreground">Taux de conversion en %</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodToggle
                value={periodType}
                onChange={(next) => {
                  setPeriodType(next);
                  if (next === "year") {
                    setYear(data.conversionYear);
                  } else {
                    setYear(data.conversionYear);
                    setMonth(data.conversionMonth ?? now.getMonth() + 1);
                  }
                }}
              />
              <PeriodNavigator
                periodType={periodType}
                year={year}
                month={month}
                availableYears={availableYears}
                onYearChange={setYear}
                onMonthChange={(y, m) => {
                  setYear(y);
                  setMonth(m);
                }}
              />
            </div>
          </div>
          <ConversionChart data={data.conversionSeries} />
        </NeuCard>

        <NeuCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Funnel pipeline</h2>
            <span className="text-xs text-muted-foreground">Volumes cumulés</span>
          </div>
          <Funnel stages={data.funnel} />
        </NeuCard>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Durée moyenne</div>
          <div className="mt-3 text-4xl font-bold">
            {data.averageDaysToClose}
            <span className="text-lg text-muted-foreground"> j</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">par dossier de la création à la clôture</p>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Sources d&apos;acquisition</div>
          <div className="mt-4 space-y-2 text-sm">
            {data.acquisitionSources.length === 0 ? (
              <p className="text-muted-foreground">Aucune source renseignée.</p>
            ) : (
              data.acquisitionSources.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${SOURCE_COLORS[s.colorKey] ?? "bg-muted"}`} />
                    {s.label}
                  </span>
                  <span className="font-semibold">{s.percent}%</span>
                </div>
              ))
            )}
          </div>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Top agent · {data.topAgent.periodLabel}
          </div>
          <div className="mt-3 text-2xl font-bold">{data.topAgent.name}</div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.topAgent.closedCount} clôture{data.topAgent.closedCount !== 1 ? "s" : ""} ·{" "}
            {data.topAgent.activeClients} dossier{data.topAgent.activeClients !== 1 ? "s actifs" : " actif"} ·
            {" "}conversion {data.topAgent.conversionRatePercent}%
          </p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {data.topAgent.selectionReason}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full neu-inset overflow-hidden">
              <div
                className="h-full bg-honeydew transition-all"
                style={{ width: `${data.topAgent.progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {data.topAgent.performanceScore}/100
            </span>
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
