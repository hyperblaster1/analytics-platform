'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ThroughputPoint = {
  timestamp: string;
  bytesPerSecond: number;
};

export function ThroughputChart({ data }: { data: ThroughputPoint[] }) {
  const formattedData = data.map((d) => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    kbps: d.bytesPerSecond / 1024,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <XAxis
            dataKey="timeLabel"
            tick={{ fontSize: 10 }}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            width={32}
            label={{
              value: 'KB/s',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 10 },
            }}
          />
          <Tooltip
            formatter={(value: unknown) => {
              if (typeof value === 'number') {
                return `${value.toFixed(1)} KB/s`;
              }
              return String(value);
            }}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="kbps"
            stroke="currentColor"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

