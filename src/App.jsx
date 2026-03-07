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
        <MonthGrid day={2}/>
      </div>
    </>
  )
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function MonthGrid(props) {
  let day = props.day;
  const date = new Date();
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();
  const currentYear = date.getFullYear();

  const leapYear = currentYear % 400 == 0 || (currentYear % 4 == 0 && currentYear % 100 != 0);
  const janFirstOffset = (currentYear % 100 + Math.floor(currentYear % 100/4)) % 7
    + (leapYear ? -1 : 0);
  const monthOffsets = [0,3,3,6,1,4,6,2,5,0,3,5];
  const currentMonthOffset = monthOffsets[currentMonth] + janFirstOffset;
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  const currentMonthDays = monthDays[currentMonth] + (leapYear && currentMonth == 1 ? 1 : 0);
  const prevMonth = mod(currentMonth - 1, 12);
  const prevMonthDays = monthDays[prevMonth] + (leapYear && prevMonth == 1 ? 1 : 0);
  const monthNames = ['January','February','March','April','May','June','July',
    'August','September','October','November','December'];

  return (
    //flex grow resizes cells by default if not fixed
    <Box sx={{ flexGrow: 1}}>
      <div>
        {monthNames[currentMonth]}
      </div>
      <Grid container spacing={0.5} columns={7}>
        {Array.from(Array(42)).map((_, index) => (
          index >= currentMonthOffset
          ? <MonthCell day={mod((index-currentMonthOffset), currentMonthDays) + 1}/>
          : <MonthCell day={mod((index-currentMonthOffset), prevMonthDays) + 1}/>
        ))}
      </Grid>
    </Box>
  );
}

function MonthCell(props){
  let day = props.day;
  return (
    <Grid size={1}>
      <Item onClick={() => {
        alert('hello');
      }}>{day}</Item>
    </Grid>
  );
}

export default App

// BrowserRouter
// Route="/" = ..//././.
