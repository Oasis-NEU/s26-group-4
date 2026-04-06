import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { getMonthName, getDaysInMonth, getMonthOffset, mod, isLeapYear, hashDate } from './Util.jsx'
import { getDateString } from './WeekGrid.jsx'
import TimePicker from './TimePicker.jsx'
import { useState } from 'react';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

function MonthGrid(props) {
  const [timeVisible, setTimeVisible] = useState(false);
  const date = props.date;
  const setDate = props.setDate;
  const handleClick = props.handleClick;
  const events = props.events || {};
  const currentMonth = date.getMonth();
  // const currentDay = date.getDate();
  const currentYear = date.getFullYear();

  const leapYear = isLeapYear(currentYear);
  const currentMonthOffset = getMonthOffset(currentMonth, currentYear, leapYear);
  const currentMonthDays = getDaysInMonth(currentMonth, leapYear);
  const prevMonth = mod(currentMonth - 1, 12);
  const prevMonthDays = getDaysInMonth(prevMonth, leapYear);
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthIndex = mod(currentMonth - 1, 12);

  return (
    //flex grow resizes cells by default if not fixed
    <Box sx={{ flexGrow: 1}}>
      <div>
      <button onClick={() => {
        setDate(decrementMonth(date));
      }}>&lt;</button>
      <button className={"button"} onClick={() => {
          togglePicker(timeVisible, setTimeVisible);
        }}>
        {getMonthName(currentMonth)} {currentYear}
      </button>
      <button onClick={() => {
        setDate(incrementMonth(date));
      }}>&gt;</button>
      </div>
      <TimePicker timeVisible={timeVisible} date={date} setDate={setDate}/>
      <Grid container spacing={.5} columns={7}>
        {Array.from(Array(42)).map((_, index) => {
          if (index >= currentMonthOffset) {
            const day = mod((index-currentMonthOffset), currentMonthDays) + 1;
            const active = index-currentMonthOffset < currentMonthDays;
            const cellDate = active
              ? new Date(currentYear, currentMonth, day)
              : new Date(currentYear, currentMonth + 1, day);
            const key = hashDate(cellDate);
            return <MonthCell key={index} day={day} active={active}
              click={handleClick} events={events[key] || []}/>
          } else {
            const day = mod((index-currentMonthOffset), prevMonthDays) + 1;
            const cellDate = new Date(prevMonthYear, prevMonthIndex, day);
            const key = hashDate(cellDate);
            return <MonthCell key={index} day={day} active={false}
              click={handleClick} events={events[key] || []}/>
          }
        })}
      </Grid>
    </Box>
  );
}

export function incrementMonth(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const day = date.getDate();
  return month == 11
          ? new Date(year + 1, 0, day)
          : new Date(year, month + 1, day);
}

export function decrementMonth(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const day = date.getDate();
  return month == 0
          ? new Date(year - 1, 11, day)
          : new Date(year, month - 1, day);
}

function togglePicker(timeVisible, setTimeVisible){
  setTimeVisible(!timeVisible);
}

function MonthCell(props){
  let day = props.day;
  let active = props.active;
  let click = props.click;
  let events = props.events;
  const [hovered, setHovered] = useState(false);

  return (
    <Grid size={1} style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <Item className={active ? "active" : "inactive"} onClick={click(day, active)}>
        {day}
        {events.length > 0 && <span className="event-dot">●</span>}
        {/* {events.length > 0 && <span className="event-dot">👹</span>} */}
      </Item>
      {hovered && (
        <div className="month-tooltip">
          {events.length === 0
            ? <div className="month-tooltip-empty">No events</div>
            : events
                .slice()
                .sort((a, b) => a.hourIndex * 60 + a.minutes - (b.hourIndex * 60 + b.minutes))
                .map((event) => (
                  <div key={event.id} className="month-tooltip-item">
                    <span className="month-tooltip-time">{getDateString(event)}</span>
                    <span className="month-tooltip-name">{event.name}</span>
                  </div>
                ))
          }
        </div>
      )}
    </Grid>
  );
}

export default MonthGrid