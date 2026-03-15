import { getDayIndexByName, getDayName, getHourName, hashDate } from './Util.jsx'
import { dayInBounds, getDateByIndex } from './WeekGrid.jsx'

function newEvent(startHourIndex, durationMinutes, name) {
  return {startHourIndex: startHourIndex, durationMinutes: durationMinutes, name: name}
}

function addEvent(formData, date, events, setEvents) {
  const day = formData.get("day");
  const starts = formData.get("starts");
  const duration = formData.get("duration");
  const eventName = formData.get("eventName");

  let hourNumber = starts.substring(0,starts.length-3);
  let hourIndex = (hourNumber == "12" ? 0 : parseInt(hourNumber)) + (starts.substring(starts.length-2) == "PM" ? 12 : 0);
  let event = newEvent(hourIndex, duration, eventName);
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
        <select name="day">
          {Array.from(Array(validDays.length)).map((_, index) => (
            <option value={validDays[index].getDate()}>
              {validDays[index].getMonth()+1}/{validDays[index].getDate()}</option>
          ))}
          {/* {Array.from(Array(7)).map((_, index) => (
            <option value={getDayName(index)}>{getDayName(index)}</option>
          ))} */}
        </select>
        <label for="starts"> Starts: </label>
        <select name="starts">
          {Array.from(Array(24)).map((_, index) => (
            <option value={getHourName(index)}>{getHourName(index)}</option>
          ))}
        </select>
        <label for="duration"> Duration: </label>
        <input type="number" min="0" name="duration" size="5"/>
        <label for="eventName"> Name: </label>
        <input type="text" name="eventName"/>
        <input type="submit" value="Add Event"/>
      </form>
    </div>
  )
}

export default EventAdder