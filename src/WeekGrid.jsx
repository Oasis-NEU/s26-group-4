import EventAdder, { setCompletion } from "./Event";
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
  return `${hourIndexToHour(event.hourIndex)}:${padZeroMinutes(event.minutes)} ${event.hourIndex < 12 ? "AM" : "PM"}`
}

export function truncateTaskName(name, dateString) {
  // let maxLength = 25;
  // if (indexOfCollision > 0) {
  //   maxLength = maxLength / (indexOfCollision + 1);
  // }
  // let fullString = name + ", " + dateString;
  // return ((fullString).length > maxLength ? fullString.substring(0, maxLength-3)
  //   + "..." : fullString)
  return name + ", " + dateString;
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
  const user = props.user;

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
      <button className={"button"} onClick={backClick}>{getMonthName(month)} {year}</button>
      <button onClick={() => {
        setDate(incrementWeek(date));
      }}>&gt;</button>
      <table className="weekGrid">
        <colgroup>
          <col span="1" style={{width: '5%'}}/>
        </colgroup>
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
                    return (<div className="task" onClick={() => setCompletion(event, !event.completion, events, setEvents, user)} style={{top: `${getTopOffset(event)}%`,
                    backgroundColor: hashNameToColor(event.name),
                    left: `${getEventCollisions(events, getDateByIndex(date, dayIndex)).find(
                      (group) => group.findIndex((e) => e.dbId == event.dbId) != -1).findIndex(
                        (e) => e.dbId == event.dbId)
                      / getEventCollisions(events, getDateByIndex(date, dayIndex)).find(
                        (group) => group.findIndex((e) => e.dbId == event.dbId) != -1).length * 100}%`,
                    width: `${100 - getEventCollisions(events, getDateByIndex(date, dayIndex)).find(
                      (group) => group.findIndex((e) => e.dbId == event.dbId) != -1).findIndex(
                        (e) => e.dbId == event.dbId)
                      / getEventCollisions(events, getDateByIndex(date, dayIndex)).find(
                        (group) => group.findIndex((e) => e.dbId == event.dbId) != -1).length * 100}%`,
                    zIndex: `${getEventCollisions(events, getDateByIndex(date, dayIndex)).find(
                      (group) => group.findIndex((e) => e.dbId == event.dbId) != -1).findIndex(
                        (e) => e.dbId == event.dbId)}`,
                    }}>
                      <span style={event.completion ? {textDecoration: "line-through"} : {}}>
                        {truncateTaskName(event.name, getDateString(event))}</span></div>);
                  })
                }
              </td>
            ))}
          </tr>
        ))}
      </table>
      <EventAdder date={date} setDate={setDate} events={events} setEvents={setEvents} user = {user}/>
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

const MINUTE_LENGTH = 15;

function inRange(hourIndex, minutes, goalHourIndex, goalMinutes) {
  if (hourIndex == goalHourIndex) {
    return Math.abs(minutes - goalMinutes) < MINUTE_LENGTH;
  }
  else if (hourIndex == goalHourIndex - 1) {
    return Math.abs(minutes - (goalMinutes+60)) < MINUTE_LENGTH;
  }
  else if (hourIndex == goalHourIndex + 1) {
    return Math.abs(minutes - (goalMinutes-60)) < MINUTE_LENGTH;
  }
  return false;
}

function getEventCollisions(events, date) {
  let filtered = [];
  let todayEvents = events[hashDate(date)].sort(
    (a,b) => (a.hourIndex*60+a.minutes) - (b.hourIndex*60+b.minutes));
  // console.log(events[hashDate(date)]);
  if (todayEvents == null) {
    return [];
  }
  let lastHourIndex;
  let lastMinutes;
  for (let i = 0; i < todayEvents.length; i++) {
    let collisionGroup;
    if (lastHourIndex == null || !inRange(todayEvents[i].hourIndex, todayEvents[i].minutes,
      lastHourIndex, lastMinutes)) {
      lastHourIndex = todayEvents[i].hourIndex;
      lastMinutes = todayEvents[i].minutes;
      collisionGroup = [];
    }
    else {
      collisionGroup = filtered.pop();
    }
    let copy = {};
    Object.assign(copy, todayEvents[i]);
    collisionGroup.push(copy);
    filtered.push(collisionGroup);
  }
  // console.log(filtered);
  return filtered;
  // return events[hashDate(date)].filter((event) => {
  //   event.startHourIndex == hourIndex;
  // })
}

export default WeekGrid