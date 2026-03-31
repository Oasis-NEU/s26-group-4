import { useState, useEffect } from 'react'
import MonthGrid from './MonthGrid';
import { incrementMonth, decrementMonth } from './MonthGrid'
import WeekGrid from './WeekGrid';
import { supabase } from './supabase';
import { addEvents } from './Event';
import { getHourAndAmFromIndex } from './Util';

async function getEvents(events, setEvents) {
  // console.log("get events")
  try {
    const { data, error } = await supabase // Destructure the Supabase call
          .from("tasks") // From the "Groceries" table
          .select("*"); // Select (fetch) everything
    if (error) throw error; // If there is an error, throw it
    if (data != null) { // If there is data fetched
      // setGroceries(data); // Set our groceries state variable to the data
      for (let i = 0; i < data.length; i++) {
        let obj = data[i];
        let deadline = new Date(obj.deadline);
        let taskName = obj.task_name;
        let username = obj.username;
        let createdAt = obj.created_at;
        let id = obj.id;
        let hourAndAm = getHourAndAmFromIndex(deadline.getHours());
        // console.log(obj);
        // console.log(username);
        // console.log(taskName);
        let exists = Object.values(events).some((day) => day.some((e) => e.dbId === id));
        if(!exists){
          addEvents(deadline.getDate(), hourAndAm[0], deadline.getMinutes(), hourAndAm[1] ? "AM" : "PM",
            taskName, deadline, events, setEvents, id);
        }
      }
    }
  } catch (error) {
    console.log(error); // If an error is caught, alert it on the client
  }
}

function Calendar() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(View.MONTH);
  const [events, setEvents] = useState({
    // old, hard coded events; going to keep just in case we need
    // "2026-3-19": [{
    //   hourIndex: 12,
    //   minutes: 0,
    //   name: "hi",
    //   id: crypto.randomUUID(),
    //   identifier: 1
    // },{
    //   hourIndex: 12,
    //   minutes: 30,
    //   name: "sbr",
    //   id: crypto.randomUUID(),
    //   identifier: 2
    // }]
  })
  useEffect(() => {
      getEvents(events, setEvents); // The function we just created
    }, [events]); // "[]" signifies that this hook will only be run on the first page load

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