import EventAdder from "./Event";
import { getDayName, getHourName, getMonthName, getDaysInMonth, getMonthOffset, mod, isLeapYear, hashDate } from './Util.jsx'

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

  function getDayByIndex(date, index) {
    return date.getDate() + index - getDayOfWeekIndex(date);
  }
  function getDateByIndex(date, index) {
    return new Date(date.getFullYear(), date.getMonth(), getDayByIndex(date, index));
  }
  function dayInBounds(date, index, month) {
    return getDayByIndex(date, index) > 0 && getDayByIndex(date, index) <= getDaysInMonth(month);
  }

  // console.log("asdas");
  // console.log(getEventsByHour(events, new Date(2026, 2, 19), 12));
  // console.log(getEventsByHour(events, getDateByIndex(date, 4), 12));
  // console.log(getEventsByHour(events, getDateByIndex(date, 4), 12).map((event) => {
  //                   return event.name;
  //                 }));

  return (
    <div>
      <button onClick={backClick}>{getMonthName(month)} {year}</button>
      <table>
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
            <td>{getHourName(hourIndex)}</td>
            {Array.from(Array(7)).map((_, dayIndex) => (
              <td>
                {getEventsByHour(events, getDateByIndex(date, dayIndex), hourIndex).length == 0
                  ? "-"
                  : getEventsByHour(events, getDateByIndex(date, dayIndex), hourIndex).map((event) => {
                    return (<div>{event.name}</div>);
                  })
                }
              </td>
            ))}
          </tr>
        ))}
      </table>
      <EventAdder events={events} setEvents={setEvents}/>
    </div>
  )
}

function getDayOfWeekIndex(date) {
  let monthOffset = getMonthOffset(date.getMonth(), date.getFullYear(),
    isLeapYear(date.getFullYear));
  return mod(monthOffset + date.getDate() - 1, 7);
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
    if (todayEvents[i].startHourIndex == hourIndex) {
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