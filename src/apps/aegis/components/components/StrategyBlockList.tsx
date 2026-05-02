import React from 'react';
import { StrategicCluster } from '../models/strategicCluster';
import StrategyBlockCard from './StrategyBlockCard';

export const StrategyBlockList = ({ blocks }: { blocks: StrategicCluster[] }) => {
  return (
    <div className="grid gap-4">
      {blocks.map(b => (
        <StrategyBlockCard key={b.id} block={b} />
      ))}
    </div>
  )
}

export default StrategyBlockList;