import React from 'react';

interface ProductStepperProps {
  value: number;
  onChange: (val: number) => void;
}

export function ProductStepper({ value, onChange }: ProductStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(value - 1)} disabled={value <= 0} className="px-2 py-1 border">-</button>
      <span>{value}</span>
      <button onClick={() => onChange(value + 1)} className="px-2 py-1 border">+</button>
    </div>
  );
}
