import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns"; //remember to install date-fns

function filterBy(events, filter, date){
  let interval;

  switch (filter) {
    case "day":
      interval = { start: startOfDay(date), end: endOfDay(date) };
      break;
    case "week":
      interval = { start: startOfWeek(date), end: endOfWeek(date) };
      break;
    case "month":
      interval = { start: startOfMonth(date), end: endOfMonth(date) };
      break;
    default:
      return events; // No filter applied
  }

  return events.filter(event => isWithinInterval(new Date(event.date), interval));
}

function App() {
  const [count, setCount] = useState(0)
  const [view, setView] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const visibleTasks = useMemo(
    () => filterTasks(allTasks, view, selectedDate),
    [allTasks, view, selectedDate]
  );
  

  return (
    <div className="view-switcher">
        <button onClick={() => setView("day")}>Day</button>
        <button onClick={() => setView("week")}>Week</button>
        <button onClick={() => setView("month")}>Month</button>
        <ViewSwitcher view={view} setView={setView} />
      </div>
      
  )
}

export default App
