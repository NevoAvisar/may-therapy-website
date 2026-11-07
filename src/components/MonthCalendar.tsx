import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BOOKING } from '../config'
import { addDays, formatLongDate, formatMonth, monthGrid, shiftMonth } from '../lib/booking'
import { cn } from '../lib/cn'

// ==========================================
// Month calendar for the booking picker | לוח חודשי לבחירת תאריך
// ==========================================
const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

interface MonthCalendarProps {
  today: string
  initialDate: string
  selected: string | null
  isEnabled: (date: string) => boolean
  onSelect: (date: string) => void
}

export default function MonthCalendar({ today, initialDate, selected, isEnabled, onSelect }: MonthCalendarProps) {
  const firstMonth = today.slice(0, 7)
  const lastMonth = addDays(today, BOOKING.daysAhead).slice(0, 7)
  const [month, setMonth] = useState(initialDate.slice(0, 7))

  const monthButton = 'grid h-11 w-11 place-items-center rounded-full text-forest-moss transition hover:bg-river-mist disabled:opacity-25 disabled:hover:bg-transparent'

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="לחודש הקודם" disabled={month <= firstMonth} onClick={() => setMonth(shiftMonth(month, -1))} className={monthButton}>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <p aria-live="polite" className="font-medium text-forest-moss">
          {formatMonth(month)}
        </p>
        <button type="button" aria-label="לחודש הבא" disabled={month >= lastMonth} onClick={() => setMonth(shiftMonth(month, 1))} className={monthButton}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div aria-hidden className="mt-3 grid grid-cols-7 text-center text-xs text-forest-moss/60">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      {/* Day buttons keep a 40px tall tap target and shrink in width on narrow phones | כפתורי הימים שומרים על גובה 40px למגע ומצטמצמים ברוחב בטלפונים צרים */}
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {monthGrid(month).map((date, i) =>
          date ? (
            <button
              key={date}
              type="button"
              disabled={!isEnabled(date)}
              aria-pressed={date === selected}
              aria-label={formatLongDate(date)}
              onClick={() => onSelect(date)}
              className={cn(
                'mx-auto grid h-10 w-full max-w-10 place-items-center rounded-full text-sm tabular-nums transition',
                date === selected
                  ? 'bg-stream-blue font-medium text-primary'
                  : 'text-forest-moss enabled:bg-river-mist/60 enabled:hover:bg-river-mist disabled:text-forest-moss/30',
                date === today && date !== selected && 'ring-1 ring-stream-aqua',
              )}
            >
              {Number(date.slice(8))}
            </button>
          ) : (
            <span key={`blank-${i}`} />
          ),
        )}
      </div>
    </div>
  )
}
