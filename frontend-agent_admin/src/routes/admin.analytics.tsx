import { createFileRoute } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

// Tiny inline sparkline / chart helpers
function ConversionChart() {
  const data = [12, 14, 11, 17, 19, 22];
  const max = 25;
  const w = 500, h = 180, pad = 20;
  const points = data.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (data.length - 1);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  const months = ["Juin", "Juil", "Août", "Sept", "Oct", "Nov"];

  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.89 0.015 252)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.89 0.015 252)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g1)" />
      <path d={path} fill="none" stroke="oklch(0.24 0 0)" strokeWidth={2.5} strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={4} fill="oklch(0.94 0.085 105)" stroke="oklch(0.24 0 0)" strokeWidth={2} />
          <text x={x} y={h + 15} textAnchor="middle" fontSize="10" fill="oklch(0.45 0.015 270)">{months[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function Funnel() {
  const stages = [
    { label: "Leads", value: 420, color: "bg-alice" },
    { label: "Qualifiés", value: 260, color: "bg-honeydew" },
    { label: "Visite", value: 145, color: "bg-vanilla" },
    { label: "Négo.", value: 78, color: "bg-[oklch(0.82_0.1_55)]" },
    { label: "Clôturés", value: 42, color: "bg-[oklch(0.75_0.12_145)]" },
  ];
  const max = stages[0].value;
  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-20 text-xs text-muted-foreground">{s.label}</span>
          <div className="flex-1 h-9 neu-inset rounded-lg overflow-hidden">
            <div
              className={`h-full ${s.color} flex items-center justify-end pr-3 text-xs font-semibold text-eerie`}
              style={{ width: `${(s.value / max) * 100}%` }}
            >
              {s.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytique & rapports</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualisez la santé commerciale de l'agence</p>
        </div>
        <button
          onClick={() => toast.success("Export PDF généré (3.2 MB)")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <FileDown size={16} /> Exporter PDF
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <NeuCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Conversion des leads — 6 mois</h2>
            <span className="text-xs text-muted-foreground">en %</span>
          </div>
          <ConversionChart />
        </NeuCard>

        <NeuCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Funnel pipeline</h2>
            <span className="text-xs text-muted-foreground">Volumes cumulés</span>
          </div>
          <Funnel />
        </NeuCard>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Durée moyenne</div>
          <div className="mt-3 text-4xl font-bold">42<span className="text-lg text-muted-foreground"> j</span></div>
          <p className="text-sm text-muted-foreground mt-2">par dossier de la création à la clôture</p>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Sources d'acquisition</div>
          <div className="mt-4 space-y-2 text-sm">
            {[
              { l: "Site web", v: 38, c: "bg-alice" },
              { l: "Facebook Ads", v: 26, c: "bg-honeydew" },
              { l: "Recommandations", v: 21, c: "bg-vanilla" },
              { l: "Autres", v: 15, c: "bg-muted" },
            ].map((s) => (
              <div key={s.l} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className={`w-3 h-3 rounded-sm ${s.c}`} /> {s.l}</span>
                <span className="font-semibold">{s.v}%</span>
              </div>
            ))}
          </div>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Top agent du mois</div>
          <div className="mt-3 text-2xl font-bold">Yasmine Chraibi</div>
          <p className="text-sm text-muted-foreground mt-1">5 clôtures · taux conversion 22%</p>
          <div className="mt-4 h-2 rounded-full neu-inset overflow-hidden">
            <div className="h-full bg-honeydew" style={{ width: "84%" }} />
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
