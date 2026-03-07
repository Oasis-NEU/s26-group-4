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
      <div >
        <MonthGrid day={2} />
      </div>
    </>
  )
}

function MonthGrid(props) {
  let day = props.day;
  return (
    //flex grow resizes cells by default if not fixed
    <Box sx={{ flexGrow: 1}}> 
      <Grid container spacing={0.5} columns={7}>
        {Array.from(Array(30)).map((_, index) => (
          <MonthCell day={index + 1}/>
        ))}
      </Grid>
    </Box>
  );
  function MonthCell(props){
    let day = props.day;
    return (
      <Grid size={1}>
        <Item>{day}</Item>
      </Grid> 
    );
  }
}

export default App

// BrowserRouter
// Route="/" = ..//././.
