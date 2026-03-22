import { getDayIndexByName, getDayName, getHourName, hashDate, mod } from './Util.jsx'
import { dayInBounds, getDateByIndex } from './WeekGrid.jsx'

function newEvent(hourIndex, minutes, name) {
  return {hourIndex: hourIndex, minutes: minutes, name: name}
}

function addEvent(formData, date, events, setEvents) {
  const day = formData.get("day");
  const hour = formData.get("hour");
  const minutes = formData.get("minutes");
  const am = formData.get("am");
  const name = formData.get("name");

  let hourIndex = (hour == "12" ? 0 : parseInt(hour)) + (am == "AM" ? 0 : 12);
  let event = newEvent(hourIndex, minutes, name);
  let eventDate = new Date(date.getFullYear(), date.getMonth(), day)
  // console.log(eventDate);
  let newEvents = {}
  let hashed = hashDate(eventDate)
  Object.assign(newEvents, events)
  if (events[hashed] == null) {
    newEvents[hashed] = [event]
    setEvents(newEvents)
  }
  else {
    let eventList = events[hashed];
    eventList.push(event);
    newEvents[hashed] = eventList;
    setEvents(newEvents);
  }
  // console.log(newEvents);
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
  return (
    <div className="eventAdder">
      <form action={(formData) => (addEvent(formData, date, events, setEvents))}>
        <label for="day">Due Date: </label>
        <select name="day">
          {Array.from(Array(validDays.length)).map((_, index) => (
            <option value={validDays[index].getDate()}>
              {validDays[index].getMonth()+1}/{validDays[index].getDate()}</option>
          ))}
          {/* {Array.from(Array(7)).map((_, index) => (
            <option value={getDayName(index)}>{getDayName(index)}</option>
          ))} */}
        </select>
        <label for="hour"> Deadline: </label>
        {/* <input type="number" min={1} max={12} name="hour"></input> */}
        <select name="hour">
          {Array.from(Array(12)).map((_, index) => (
            <option value={index + 1}>{index + 1}</option>
          ))}
        </select>
        <label for="minutes"> : </label>
        <select name="minutes">
          {Array.from(Array(60)).map((_, index) => (
            <option value={index}>{index.toString().length == 1 ? "0" + index.toString() : index.toString()}</option>
          ))}
        </select>
        <label for="am"> </label>
        <select name="am">
          {Array.from(Array(2)).map((_, index) => (
            <option value={index == 0 ? "AM" : "PM"}>{index == 0 ? "AM" : "PM"}</option>
          ))}
        </select>
        <label for="name"> Name: </label>
        <input type="text" name="name"/>
        <input type="submit" value="Add Task"/>
      </form>
    </div>
  )
}

export default EventAdder