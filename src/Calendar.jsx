import { useState } from 'react'
import MonthGrid from './MonthGrid';
import { incrementMonth, decrementMonth } from './MonthGrid'
import WeekGrid from './WeekGrid';

function Calendar() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(View.MONTH);
  const [events, setEvents] = useState({
    "2026-3-19": [{
      hourIndex: 12,
      minutes: 0,
      am: "AM",
      name: "steel ball run"
    },{
      hourIndex: 12,
      minutes: 30,
      am: "AM",
      name: "other event"
    }]
  })

  function monthCellClick(day, active) {
    if (active) {
      return () => {
        // alert(day);
        setView(View.WEEK);
        setDate(new Date(date.getFullYear(), date.getMonth(), day));
      }
    }
    return () => {
      if (day >= 14) {
        setDate(decrementMonth)
      }
      else {
        setDate(incrementMonth);
      }
    };
  }

  return (
    <div className="calendar">
      {
        view == View.MONTH
          ? <MonthGrid date={date} setDate={setDate} handleClick={monthCellClick}/>
          : <WeekGrid date={date} setDate={setDate} events={events} setEvents={setEvents}
            backClick={() => {setView(View.MONTH)}}/>
      }
    </div>
  )
}

const View = {
  MONTH: "month",
  WEEK: "week",
}

export default Calendar