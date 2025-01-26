'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SkinMetric } from '../BeautyRiskAssessment';

interface MetricsDisplayProps {
  metrics: SkinMetric[];
}

const MetricsDisplay = memo(function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {metrics.map((metric) => (
        <Card key={metric.name} className="p-4">
          <h3 className="font-semibold mb-2">{metric.name}</h3>
          <Progress 
            value={metric.value * 100} 
            className="mb-2"
            indicatorClassName={`bg-${metric.value > 0.7 ? 'green' : metric.value > 0.4 ? 'yellow' : 'red'}-500`}
          />
          <p className="text-sm text-muted-foreground">{metric.description}</p>
        </Card>
      ))}
    </div>
  );
});

export default MetricsDisplay; 