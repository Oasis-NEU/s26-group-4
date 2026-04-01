import { useEffect, useState } from 'react';
import { getDayName, hashDate } from './Util.jsx'
import { dayInBounds, getDateByIndex } from './WeekGrid.jsx'

function newEvent(hourIndex, minutes, name, dbId = null) {
  return {hourIndex: hourIndex, minutes: minutes, name: name, id: crypto.randomUUID(), dbId: dbId}
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

export function addEvents(day, hour, minutes, am, name, date, events, setEvents, dbId, recurringEnabled, occurrences, selectedWeekdays) {
  // console.log("add events")
  let hourIndex = (hour == "12" ? 0 : parseInt(hour)) + (am == "AM" ? 0 : 12);
  let eventDate = new Date(date.getFullYear(), date.getMonth(), day)
  let recurringDates = getRecurringDates(eventDate, recurringEnabled, occurrences, selectedWeekdays);
  let newEvents = {}
  Object.assign(newEvents, events)
  // console.log(events)

  recurringDates.forEach((recurrenceDate) => {
    let event = newEvent(hourIndex, parseInt(minutes), name, dbId);
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

  // console.log(newEvents)
  setEvents(newEvents);
}

function EventAdder(props) {
  const date = props.date;
  const setDate = props.setDate;
  const events = props.events;
  const setEvents = props.setEvents;
  
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
      date,
      events,
      setEvents,
      null,
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