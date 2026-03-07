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
<<<<<<< HEAD
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

=======
  // const [count, setCount] = useState(0)

  return (
    <>
      <div >
        <MonthGrid day={2} />
      </div>
    </>
  )
}

function MonthGrid(props) {
  let day = props.day;
  return (
    //flex grow resizes cells by default if not fixed
    <Box sx={{ flexGrow: 1}}> 
      <Grid container spacing={0.5}>
        {Array.from(Array(30)).map((_, index) => (
          <MonthCell day={index + 1}/>
        ))}
      </Grid>
    </Box>
  );
  function MonthCell(props){
    let day = props.day;
    return (
      <Grid size={40}>
        <Item>{day}</Item>
      </Grid> 
    );
  }
}

>>>>>>> f19da3f (monthcell object creation)
export default App

// BrowserRouter
// Route="/" = ..//././.
