'use client'

interface TimeSelectorProps {
  value: number
  onChange: (hours: number) => void
  className?: string
}

const TIME_OPTIONS = [
  { value: 0.25, label: '15 min' },
  { value: 0.5, label: '30 min' },
  { value: 0.75, label: '45 min' },
  { value: 1, label: '1h' },
  { value: 1.25, label: '1h 15' },
  { value: 1.5, label: '1h 30' },
  { value: 1.75, label: '1h 45' },
  { value: 2, label: '2h' },
  { value: 2.25, label: '2h 15' },
  { value: 2.5, label: '2h 30' },
  { value: 2.75, label: '2h 45' },
  { value: 3, label: '3h' },
  { value: 3.25, label: '3h 15' },
  { value: 3.5, label: '3h 30' },
  { value: 3.75, label: '3h 45' },
  { value: 4, label: '4h' },
  { value: 4.25, label: '4h 15' },
  { value: 4.5, label: '4h 30' },
  { value: 4.75, label: '4h 45' },
  { value: 5, label: '5h' },
  { value: 5.25, label: '5h 15' },
  { value: 5.5, label: '5h 30' },
  { value: 5.75, label: '5h 45' },
  { value: 6, label: '6h' },
  { value: 6.25, label: '6h 15' },
  { value: 6.5, label: '6h 30' },
  { value: 6.75, label: '6h 45' },
  { value: 7, label: '7h' },
  { value: 7.25, label: '7h 15' },
  { value: 7.5, label: '7h 30' },
  { value: 7.75, label: '7h 45' },
  { value: 8, label: '8h' },
  { value: 8.25, label: '8h 15' },
  { value: 8.5, label: '8h 30' },
  { value: 8.75, label: '8h 45' },
  { value: 9, label: '9h' },
  { value: 9.25, label: '9h 15' },
  { value: 9.5, label: '9h 30' },
  { value: 9.75, label: '9h 45' },
  { value: 10, label: '10h' },
  { value: 10.25, label: '10h 15' },
  { value: 10.5, label: '10h 30' },
  { value: 10.75, label: '10h 45' },
  { value: 11, label: '11h' },
  { value: 11.25, label: '11h 15' },
  { value: 11.5, label: '11h 30' },
  { value: 11.75, label: '11h 45' },
  { value: 12, label: '12h' }
]

export function TimeSelector({ value, onChange, className = '' }: TimeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-24 px-3 py-2 text-center rounded-lg border border-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white ${className}`}
    >
      {TIME_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
} 