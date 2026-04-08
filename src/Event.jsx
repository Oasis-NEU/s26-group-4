import { useEffect, useState } from 'react';
import { getDayName, hashDate } from './Util.jsx'
import { dayInBounds, getDateByIndex } from './WeekGrid.jsx'
import { supabase } from './supabase'

export async function deleteDbEvent(event, events, setEvents, user) {
  let hashed = hashDate(event.deadline);
  let today = events[hashed];
  let filtered = today.filter((e) => e.dbId != event.dbId)
  let newEvents = { ...events, [hashed]: filtered };
  setEvents(newEvents);
  if(user){
    try {
      const { data, error } = await supabase // Destructure the Supabase call
        .from("tasks") // From our "Groceries" table
        .delete() // Delete
        .match({ "id": event.dbId }); // The item that has the same id as the inputted id
      if (error) throw error; // If there's an error, throw it
    } catch (error) {
      alert(error); // If there is an error, alert it on the window.
    }
  }
  getEvents();
}

export async function setCompletion(event, completion, events, setEvents, user) {
  let newEvent = {}
  Object.assign(newEvent, event);
  newEvent.completion = completion;
  updateEvent(newEvent, {completion: completion}, events, setEvents, user ? true : false)
}

export async function updateEvent(event, properties, events, setEvents, save) {
  // console.log(event)
  let hashed = hashDate(event.deadline);
  let today = events[hashed];
  let filtered = today.filter((e) => e.dbId != event.dbId)
  filtered.push(event)
  let newEvents = { ...events, [hashed]: filtered };
  setEvents(newEvents);
  if (save) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(properties)
        .eq("id", event.dbId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.log(error);
    }
  }
}

async function saveEvent(event, setEvents) {
  console.log("saving")
  console.log(event)
  if (event.userId == null) { return }
  let entry = {
    task_name: event.name,
    deadline: event.deadline,
    user_id: event.userId,
    completion: event.completion
  }
  try {
    const { data, error } = await supabase // Destructuring our Supabase call
      .from("tasks") // Get our "Groceries" table
      .insert(entry) // Insert passed in name and price
      .single(); // Only insert it once
    if (error) throw error; // If there is an error, throw it
    // clanker: Replace the local null-dbId event with the real DB id
    let hashed = hashDate(event.deadline);
    setEvents((prev) => {
      if (!prev[hashed]) return prev;
      return { ...prev, [hashed]: prev[hashed].map((e) =>
        e.dbId === null && e.tempId === event.tempId
          ? { ...e, dbId: data.id, tempId: null }
          : e
      )};
    });
  } catch (error) {
    alert(error); // If an error is caught, alert it on screen
  }
}

function newEvent(hourIndex, minutes, name, dbId = null, userId, save, date, completion = false, setEvents) {
  let event = {hourIndex: hourIndex, minutes: minutes, name: name,
    dbId: userId ? dbId : crypto.randomUUID(), tempId: save ? crypto.randomUUID() : null,
    userId: userId, completion: completion,
    deadline: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hourIndex, minutes)}
  // console.log(event)
  // console.log(save)
  // console.log(date)
  if (save) {
    saveEvent(event, setEvents)
  }
  return event
}

function getRecurringDates(startDate, recurringEnabled, occurrences, selectedWeekdays) {
  if (!recurringEnabled) {
    return [startDate];
  }

  const recurringDates = [];
  const validWeekdays = selectedWeekdays.length > 0
    ? selectedWeekdays
    : [startDate.getDay()];

  for (let week = 0; week < occurrences; week++) {
  validWeekdays.forEach((weekday) => {
    // Calculate the date for this weekday in this week
    let diff = (weekday - startDate.getDay() + 7) % 7; // days until this weekday
    let eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + diff + week * 7);
    recurringDates.push(eventDate);
  });
}

  return recurringDates;
}

export function addEvents(day, hour, minutes, am, name, monthIndex, year, events, setEvents,
  dbId, userId, completion = false, save, recurringEnabled, occurrences, selectedWeekdays) {
  // console.log("add events")
  let hourIndex = (hour == "12" ? 0 : parseInt(hour)) + (am == "AM" ? 0 : 12);
  let eventDate = new Date(year, monthIndex, day)
  let recurringDates = getRecurringDates(eventDate, recurringEnabled, occurrences, selectedWeekdays);
  let newEvents = {}
  Object.assign(newEvents, events)
  console.log(events)

  recurringDates.forEach((recurrenceDate) => {
    let event = newEvent(hourIndex, parseInt(minutes), name, dbId, userId, save, recurrenceDate, completion, setEvents);
    // console.log(event)
    let hashed = hashDate(recurrenceDate)
    // console.log(hashed)
    // console.log(newEvents)
    // console.log(newEvents.hashed)
    // console.log(newEvents[hashed]==null)
    if (newEvents[hashed] == null) {
      newEvents[hashed] = [event]
      // console.log(newEvents)
      // console.log(newEvents[hashed])
    }
    else {
      let eventList = newEvents[hashed];
      // console.log(eventList)
      eventList.push(event);
      newEvents[hashed] = eventList;
      // console.log(eventList)
    }
    // console.log(newEvents)
  });

  console.log(newEvents)
  setEvents(newEvents);
}

function EventAdder(props) {
  const date = props.date;
  const setDate = props.setDate;
  const events = props.events;
  const setEvents = props.setEvents;
  const user = props.user;
  const isDeleting = props.isDeleting;
  const setIsDeleting = props.setIsDeleting;
  
  const validDays = [];
  for (let i = 0; i < 7; i++) {
    if (dayInBounds(date, i, date.getMonth())) {
      validDays.push(getDateByIndex(date, i));
    }
    // console.log(validDays[i]);
  }

  const [selectedDay, setSelectedDay] = useState(validDays.length > 0 ? `${validDays[0].getDate()}` : `${date.getDate()}`);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinutes, setSelectedMinutes] = useState("00");
  const [selectedAm, setSelectedAm] = useState("AM");
  const [name, setName] = useState("");
  const [occurrences, setOccurrences] = useState("1");
  const [repeatDays, setRepeatDays] = useState([]);
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    const dayStillValid = validDays.some((d) => `${d.getDate()}` == selectedDay);
    if (!dayStillValid && validDays.length > 0) {
      setSelectedDay(`${validDays[0].getDate()}`);
    }
  }, [date, selectedDay]);

  function onSubmit(event) {
    event.preventDefault();
    addEvents(
      selectedDay,
      selectedHour,
      selectedMinutes,
      selectedAm,
      name,
      date.getMonth(),
      date.getFullYear(),
      events,
      setEvents,
      null,
      user ? user.id : null,
      false,
      true,
      isRecurring,
      Math.max(1, parseInt(occurrences) || 1),
      repeatDays,
    );

    setName("");
    setIsRecurring(false);
    setOccurrences("1");
    setRepeatDays([]);
  }

  function onRepeatDayToggle(dayIndex, checked) {
    if (checked) {
      if (!repeatDays.includes(dayIndex)) {
        setRepeatDays([...repeatDays, dayIndex]);
      }
      return;
    }
    setRepeatDays(repeatDays.filter((value) => value != dayIndex));
  }

  return (
    <div className="eventAdder">
      <form onSubmit={onSubmit}>
        <label for="toggleDelete" style={{padding:10, left:"-10%", position:"relative"}}>
          <input
            type="checkbox"
            name="toggleDelete"
            checked={isDeleting}
            onChange={(event) => setIsDeleting(event.target.checked)}
          />
          Toggle Deletion
        </label>
        <label htmlFor="day">Due Date: </label>
        <select className={"font"} name="day" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
          {Array.from(Array(validDays.length)).map((_, index) => (
            <option key={index} value={`${validDays[index].getDate()}`}>
              {validDays[index].getMonth()+1}/{validDays[index].getDate()}</option>
          ))}
          {/* {Array.from(Array(7)).map((_, index) => (
            <option value={getDayName(index)}>{getDayName(index)}</option>
          ))} */}
        </select>
        <label for="hour"> Deadline: </label>
        <select className={"font"} name="hour" value={selectedHour} onChange={(event) => setSelectedHour(event.target.value)}>
          {Array.from(Array(12)).map((_, index) => (
            <option key={index} value={index + 1}>{index + 1}</option>
          ))}
        </select>
        <label for="minutes"> : </label>
        <select className={"font"} name="minutes" value={selectedMinutes} onChange={(event) => setSelectedMinutes(event.target.value)}>
          {Array.from(Array(60)).map((_, index) => (
            <option key={index} value={index.toString().length == 1 ? "0" + index.toString() : index.toString()}>{index.toString().length == 1 ? "0" + index.toString() : index.toString()}</option>
          ))}
        </select>
        <label for="am"> </label>
        <select className={"font"} name="am" value={selectedAm} onChange={(event) => setSelectedAm(event.target.value)}>
          {Array.from(Array(2)).map((_, index) => (
            <option key={index} value={index == 0 ? "AM" : "PM"}>{index == 0 ? "AM" : "PM"}</option>
          ))}
        </select>
        <label for="name"> Name: </label>
        <input className={"font"} type="text" name="name" value={name} onChange={(event) => setName(event.target.value)}/>
        <label for="isRecurring" style={{padding:10}}>
          <input
            type="checkbox"
            name="isRecurring"
            checked={isRecurring}
            onChange={(event) => setIsRecurring(event.target.checked)}
          />
          Recurring event
        </label>
        <input className={"font"} type="submit" value="Add Task"/>

        {isRecurring ? (
          <div style={{ marginTop: "8px" }}>
            <label for="occurrences"> # Occurrences: </label>
            <input
              type="number"
              name="occurrences"
              min="1"
              value={occurrences}
              onChange={(event) => setOccurrences(event.target.value)}
            />
            <span style={{ marginLeft: "8px" }}>Repeat On: </span>
            {Array.from(Array(7)).map((_, dayIndex) => (
              <label key={dayIndex} style={{ marginLeft: "6px" }}>
                <input
                  type="checkbox"
                  name="repeatDays"
                  value={dayIndex}
                  checked={repeatDays.includes(dayIndex)}
                  onChange={(event) => onRepeatDayToggle(dayIndex, event.target.checked)}
                />
                {getDayName(dayIndex)}
              </label>
            ))}
          </div>
        ) : ""}
      </form>
    </div>
  )
}

export default EventAdder