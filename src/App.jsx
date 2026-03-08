import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

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

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <Calendar/>
    </>
  )
}

const View = {
  MONTH: "month",
  WEEK: "week",
}

function Calendar() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(View.MONTH);

  function handleClick(day, active) {
    if (active) {
      return () => {
        alert(day);
        setView(View.WEEK);
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
      <MonthGrid date={date} setDate={setDate} handleClick={handleClick}/>
      view: {view}
    </div>
  )
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function getDaysInMonth(month, leapYear) {
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  return monthDays[month] + (leapYear && month == 1 ? 1 : 0);
}

function getMonthName(month) {
  const monthNames = ['January','February','March','April','May','June','July',
    'August','September','October','November','December'];
  return monthNames[month];
}

function isLeapYear(year) {
  return year % 400 == 0 || (year % 4 == 0 && year % 100 != 0);
}

function getMonthOffset(month, year, leapYear) {
  const janFirstOffset = (year % 100 + Math.floor(year % 100/4)) % 7
    + (leapYear ? -1 : 0);
  const monthOffsets = [0,3,3,6,1,4,6,2,5,0,3,5];
  const result = (monthOffsets[month] + janFirstOffset) % 7;
  return result == 0 ? 7 : result;
}

function incrementMonth(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month == 11
          ? new Date(year + 1, 0)
          : new Date(year, month + 1)
}

function decrementMonth(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month == 0
          ? new Date(year - 1, 11)
          : new Date(year, month - 1);
}

function MonthGrid(props) {
  const date = props.date;
  const setDate = props.setDate;
  const handleClick = props.handleClick;
  const currentMonth = date.getMonth();
  // const currentDay = date.getDate();
  const currentYear = date.getFullYear();

  const leapYear = isLeapYear(currentYear);
  const currentMonthOffset = getMonthOffset(currentMonth, currentYear, leapYear);
  const currentMonthDays = getDaysInMonth(currentMonth, leapYear);
  const prevMonth = mod(currentMonth - 1, 12);
  const prevMonthDays = getDaysInMonth(prevMonth, leapYear);

  return (
    //flex grow resizes cells by default if not fixed
    <Box sx={{ flexGrow: 1}}>
      <button onClick={() => {
        setDate(decrementMonth(date));
      }}>&lt;</button>
      <button>
        {getMonthName(currentMonth)} {currentYear}
      </button>
      <button onClick={() => {
        setDate(incrementMonth(date));
      }}>&gt;</button>
      <Grid container spacing={0.5} columns={7}>
        {Array.from(Array(42)).map((_, index) => (
          index >= currentMonthOffset
          ? <MonthCell day={mod((index-currentMonthOffset), currentMonthDays) + 1}
            active={index-currentMonthOffset<currentMonthDays}
            click={handleClick}/>
          : <MonthCell day={mod((index-currentMonthOffset), prevMonthDays) + 1}
            active={false}
            click={handleClick}/>
        ))}
      </Grid>
    </Box>
  );
}

function MonthCell(props){
  let day = props.day;
  let active = props.active;
  let click = props.click;
  return (
    <Grid size={1}>
      <Item onClick={click(day, active)}>{day}</Item>
    </Grid>
  );
}

export default App

// BrowserRouter
// Route="/" = ..//././.
