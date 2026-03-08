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
      <div className="calendar">
        <MonthGrid/>
      </div>
    </>
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

function MonthGrid(props) {
  // let day = props.day;
  const [date, setDate] = useState(new Date());
  // const date = new Date();
  const currentMonth = date.getMonth();
  // const currentDay = date.getDate();
  const currentYear = date.getFullYear();

  const leapYear = isLeapYear(currentYear);
  const currentMonthOffset = getMonthOffset(currentMonth, currentYear, leapYear);
  const currentMonthDays = getDaysInMonth(currentMonth, leapYear);
  const prevMonth = mod(currentMonth - 1, 12);
  const prevMonthDays = getDaysInMonth(prevMonth, leapYear);

  function handleClick(day, active) {
    return active ? () => {
     alert(day);
    }
    : () => {};
  }

  return (
    //flex grow resizes cells by default if not fixed
    <Box sx={{ flexGrow: 1}}>
      <button onClick={() => {
        setDate(currentMonth == 0
          ? new Date(currentYear - 1, 11)
          : new Date(currentYear, currentMonth - 1));
      }}>&lt;</button>
      <button>
        {getMonthName(currentMonth)} {currentYear}
      </button>
      <button onClick={() => {
        setDate(currentMonth == 11
          ? new Date(currentYear + 1, 0)
          : new Date(currentYear, currentMonth + 1));
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
