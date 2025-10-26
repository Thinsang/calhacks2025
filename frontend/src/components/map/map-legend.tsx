"use client";

import { motion } from "framer-motion";

export function MapLegend() {
  const legendItems = [
    { 
      color: "bg-blue-500", 
      shadowColor: "shadow-blue-500/20",
      label: "Not Busy", 
      range: "<40",
      description: "Low foot traffic"
    },
    { 
      color: "bg-yellow-400", 
      shadowColor: "shadow-yellow-400/20",
      label: "Moderate", 
      range: "40-65",
      description: "Medium foot traffic"
    },
    { 
      color: "bg-red-500", 
      shadowColor: "shadow-red-500/20",
      label: "Busy", 
      range: ">65",
      description: "High foot traffic"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="pointer-events-auto glass-panel rounded-2xl p-4 shadow-elevated"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Traffic Levels</h3>
          <p className="text-xs text-muted-foreground">Historical density</p>
        </div>
      </div>
      
      <div className="space-y-2.5">
        {legendItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            className="group flex items-center justify-between rounded-xl border border-border/40 bg-background/30 p-2.5 transition-all hover:border-border/60 hover:bg-background/50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`h-3 w-3 rounded-full ${item.color} shadow-lg ${item.shadowColor}`} />
                <div className={`absolute inset-0 rounded-full ${item.color} opacity-20 blur-sm`} />
              </div>
              <div>
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1 text-xs font-mono font-medium">
              {item.range}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
