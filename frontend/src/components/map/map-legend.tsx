export function MapLegend() {
  const legendItems = [
    { color: "bg-blue-500", label: "Not Busy (<40)" },
    { color: "bg-yellow-400", label: "Moderate (40-65)" },
    { color: "bg-red-500", label: "Busy (>65)" },
  ];

  return (
    <div className="pointer-events-auto rounded-md border bg-background/80 px-4 py-2 shadow-sm backdrop-blur">
      <div className="mb-2 text-xs font-semibold">Foot Traffic</div>
      <div className="space-y-1">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${item.color}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
