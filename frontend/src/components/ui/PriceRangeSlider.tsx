import { useCallback, useEffect, useState, useRef } from 'react';

type PriceRangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: { min: number; max: number };
  onChange: ({ min, max }: { min: number; max: number }) => void;
};

export function PriceRangeSlider({ min, max, step = 1, value, onChange }: PriceRangeSliderProps) {
  const [minVal, setMinVal] = useState(value.min);
  const [maxVal, setMaxVal] = useState(value.max);
  const range = useRef<HTMLDivElement>(null);

  // ✅ ADD THIS HOOK to sync props with internal state
  // This is the fix. It listens for changes to the value prop from the parent.
  useEffect(() => {
    setMinVal(value.min);
    setMaxVal(value.max);
  }, [value.min, value.max]);

  // Convert to percentage
  const getPercent = useCallback((val: number) => Math.round(((val - min) / (max - min)) * 100), [min, max]);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, maxVal, getPercent]);

  // Handle final change by calling the parent's onChange
  const handleMouseUp = () => {
    onChange({ min: minVal, max: maxVal });
  };

  return (
    <div className="relative h-10 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={(event) => {
          const val = Math.min(Number(event.target.value), maxVal - (step || 1));
          setMinVal(val);
        }}
        onMouseUp={handleMouseUp} // Call onChange on release
        onTouchEnd={handleMouseUp} // For mobile
        className="thumb thumb--left"
        style={{ zIndex: minVal > max - 100 ? 5 : undefined }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={(event) => {
          const val = Math.max(Number(event.target.value), minVal + (step || 1));
          setMaxVal(val);
        }}
        onMouseUp={handleMouseUp} // Call onChange on release
        onTouchEnd={handleMouseUp} // For mobile
        className="thumb thumb--right"
      />

      <div className="relative w-full">
        <div className="absolute rounded h-1.5 bg-muted w-full z-0" />
        <div ref={range} className="absolute rounded h-1.5 bg-primary z-1" />
      </div>
    </div>
  );
}