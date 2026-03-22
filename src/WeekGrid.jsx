import EventAdder from "./Event";
import { getDayName, getHourName, getMonthName, getDaysInMonth, getMonthOffset, mod, isLeapYear, hashDate } from './Util.jsx'

export function getDayByIndex(date, index) {
  return date.getDate() + index - getDayOfWeekIndex(date);
}
export function getDateByIndex(date, index) {
  return new Date(date.getFullYear(), date.getMonth(), getDayByIndex(date, index));
}
export function dayInBounds(date, index, month) {
  return getDayByIndex(date, index) > 0 && getDayByIndex(date, index) <= getDaysInMonth(month);
}

export function getDayOfWeekIndex(date) {
  let monthOffset = getMonthOffset(date.getMonth(), date.getFullYear(),
    isLeapYear(date.getFullYear));
  return mod(monthOffset + date.getDate() - 1, 7);
}

export function getTopOffset(event) {
  return event.minutes / 60 * 100;
}

export function padZeroMinutes(minutes) {
  return minutes < 10 ? "0" + minutes : "" + minutes
}

export function hourIndexToHour(hourIndex) {
  return hourIndex == 0 ? 12 : hourIndex
}

export function getDateString(event) {
  return `${hourIndexToHour(event.hourIndex)}:${padZeroMinutes(event.minutes)} ${event.am}`
}

export function truncateTaskName(name) {
  return name.length > 15 ? name.substring(0, 15) + "..." : name
}

function hashNameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const unsignedHash = hash >>> 0;
  const red = ((unsignedHash >> 16) & 255);
  const green = ((unsignedHash >> 8) & 255);
  const blue = (unsignedHash & 255);

  const normalizedRed = Math.floor(red / 2) + 64;
  const normalizedGreen = Math.floor(green / 2) + 64;
  const normalizedBlue = Math.floor(blue / 2) + 64;

  return `#${normalizedRed.toString(16).padStart(2, '0')}${normalizedGreen.toString(16).padStart(2, '0')}${normalizedBlue.toString(16).padStart(2, '0')}`;
}

export function incrementWeek(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
}

export function decrementWeek(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
}

function WeekGrid(props) {
  const date = props.date;
  const setDate = props.setDate;
  const events = props.events;
  const setEvents = props.setEvents;
  const backClick = props.backClick;

  const month = date.getMonth();
  const year = date.getFullYear();
  const day = date.getDate();
  // const dayOfWeekIndex = getDayOfWeekIndex(date);

  // console.log("asdas");
  // console.log(getEventsByHour(events, new Date(2026, 2, 19), 12));
  // console.log(getEventsByHour(events, getDateByIndex(date, 4), 12));
  // console.log(getEventsByHour(events, getDateByIndex(date, 4), 12).map((event) => {
  //                   return event.name;
  //                 }));

  return (
    <div>
      <button onClick={() => {
        setDate(decrementWeek(date));
      }}>&lt;</button>
      <button onClick={backClick}>{getMonthName(month)} {year}</button>
      <button onClick={() => {
        setDate(incrementWeek(date));
      }}>&gt;</button>
      <table class="weekGrid">
        <tr>
          <th></th>
          {Array.from(Array(7)).map((_, index) => (
            <th>
            {getDayName(index)} {dayInBounds(date, index, month)
              ? month + 1
              : ""
            }
            {dayInBounds(date, index, month) ? "/" : ""}
            {dayInBounds(date, index, month)
              ? getDayByIndex(date, index)
              : ""
            }</th>
          ))}
        </tr>
        {Array.from(Array(24)).map((_, hourIndex) => (
          <tr>
            <th className="timeColumn">{getHourName(hourIndex)}</th>
            {Array.from(Array(7)).map((_, dayIndex) => (
              <td>
                {getEventsByHour(events, getDateByIndex(date, dayIndex), hourIndex).length == 0
                  ? ""
                  : getEventsByHour(events, getDateByIndex(date, dayIndex), hourIndex).map((event) => {
                    return (<div className="task" style={{top: `${getTopOffset(event)}%`, backgroundColor: hashNameToColor(event.name)}}>
                      {truncateTaskName(event.name)}, {getDateString(event)}</div>);
                  })
                }
              </td>
            ))}
          </tr>
        ))}
      </table>
      <EventAdder date={date} setDate={setDate} events={events} setEvents={setEvents}/>
    </div>
  )
}

function getEventsByHour(events, date, hourIndex) {
  let filtered = [];
  // console.log(events["2026-3-19"]);
  // filtered.push(events["2026-3-19"][0].name);
  // return filtered;
  let todayEvents = events[hashDate(date)];
  if (todayEvents == null) {
    // console.log(hashDate(date));
    return [];
  }
  for (let i = 0; i < todayEvents.length; i++) {
    if (todayEvents[i].hourIndex == hourIndex) {
      let copy = {};
      Object.assign(copy, todayEvents[i]);
      filtered.push(copy);
    }
  }
  return filtered;
  // return events[hashDate(date)].filter((event) => {
  //   event.startHourIndex == hourIndex;
  // })
}

export default WeekGrid