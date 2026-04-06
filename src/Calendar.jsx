import { useState, useEffect } from 'react'
import MonthGrid from './MonthGrid';
import { incrementMonth, decrementMonth } from './MonthGrid'
import WeekGrid from './WeekGrid';
import { supabase } from './supabase';
import { addEvents } from './Event';
import { getHourAndAmFromIndex } from './Util';

// Fetch events from Supabase and add to state
async function getEvents(events, setEvents, user) {
  // console.log("get events")
  try {
    if(!user){ return }
    const { data, error } = await supabase // Destructure the Supabase call
          .from("tasks") // From the "Groceries" table
          .select("*") // Select (fetch) everything
          .eq("user_id", user.id); 
    if (error) throw error; // If there is an error, throw it
    if (data != null) { // If there is data fetched
      // setGroceries(data); // Set our groceries state variable to the data
      for (let i = 0; i < data.length; i++) {
        let obj = data[i];
        let deadline = new Date(obj.deadline);
        let taskName = obj.task_name;
        let userid = obj.userid;
        let createdAt = obj.created_at;
        let id = obj.id;
        let hourAndAm = getHourAndAmFromIndex(deadline.getHours());
        // console.log(obj);
        // console.log(username);
        // console.log(taskName);
        let exists = Object.values(events).some((day) => day.some((e) => e.dbId === id));
        if(!exists){
          addEvents(deadline.getDate(), hourAndAm[0], deadline.getMinutes(), hourAndAm[1] ? "AM" : "PM",
            taskName, deadline, events, setEvents, id, userid);
        }
      }
    }
  } catch (error) {
    console.log(error); // If an error is caught, alert it on the client
  }
}

// Login dropdown component with New User option
function AuthDropdown({ user, setUser }) {
  const [visible, setVisible] = useState(false) // Dropdown visibility
  const [email, setEmail] = useState('') // Email input
  const [password, setPassword] = useState('') // Password input

  const [showNewUserPopup, setShowNewUserPopup] = useState(false) // Tracks new user form visibility
  const [newUserEmail, setNewUserEmail] = useState('') // New user email input
  const [newUserPassword, setNewUserPassword] = useState('') // New user password input

  // Sign in with email + password
  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) alert(error.message) // Alert error if login fails
    else {
      setUser(data.user) // Save logged-in user
      setVisible(false) // Close dropdown after login
    }
  }

  // Sign out user
  async function signOut() {
    await supabase.auth.signOut() // Supabase logout
    setUser(null) // Clear user from state
  }

  // Handle new user creation
  async function handleNewUserSubmit() {
    const { data, error } = await supabase.auth.signUp({
      email: newUserEmail,
      password: newUserPassword
    });
    if (error) alert(error.message)
    else {
      alert('User created! Please login.')
      setShowNewUserPopup(false)
      setNewUserEmail('')
      setNewUserPassword('')
    }
  }

  return (
    <div style={{ position: 'absolute', top: 10, right: 10 }}>
      {user
        ? <div style={{ position: 'relative' }}>
            <button onClick={() => setVisible(!visible)}>
              {user.email} {/* Show logged-in user */}
            </button>
            {visible && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                padding: '10px',
                zIndex: 1000
              }}>
                <button onClick={signOut}>Logout</button> {/* Logout button */}
              </div>
            )}
          </div>
        : <div style={{ display: 'inline-block' }}>
            <button onClick={() => setVisible(!visible)}>Login</button> {/* Show login if no user */}
            <button style={{marginLeft: '6px'}} onClick={() => setShowNewUserPopup(true)}>New User</button> {/* New user button */}
          </div>
      }
      {visible && !user && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '10px',
          zIndex: 1000
        }}>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email"
            style={{ display: 'block', marginBottom: '10px' }}
          />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password"
            style={{ display: 'block', marginBottom: '10px' }}
          />
          <button onClick={signIn}>Login</button>
        </div>
      )}
      {showNewUserPopup && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '10px',
          zIndex: 1000
        }}>
          <input 
            type="email" 
            value={newUserEmail} 
            onChange={e => setNewUserEmail(e.target.value)} 
            placeholder="Email"
            style={{ display: 'block', marginBottom: '10px' }}
          />
          <input 
            type="password" 
            value={newUserPassword} 
            onChange={e => setNewUserPassword(e.target.value)} 
            placeholder="Password"
            style={{ display: 'block', marginBottom: '10px' }}
          />
          <button onClick={handleNewUserSubmit}>Create User</button>
          <button style={{marginLeft:'6px'}} onClick={()=>setShowNewUserPopup(false)}>Cancel</button>
        </div>
      )}
    </div>
  )
}

function Calendar() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(View.MONTH);
  const [events, setEvents] = useState({
    // old, hard coded events; going to keep just in case we need
    // "2026-3-19": [{
    //   hourIndex: 12,
    //   minutes: 0,
    //   name: "hi",
    //   id: crypto.randomUUID(),
    //   identifier: 1
    // },{
    //   hourIndex: 12,
    //   minutes: 30,
    //   name: "sbr",
    //   id: crypto.randomUUID(),
    //   identifier: 2
    // }]
  })
  const [user, setUser] = useState(null) // Store logged-in user
  // useEffect(() => {
  //     getEvents(events, setEvents); // The function we just created
  //   }, [events]); // "[]" signifies that this hook will only be run on the first page load

  // On mount, get user from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(res => setUser(res.data.user))
  }, [])

  // Fetch events once user is logged in
  useEffect(() => {
    if (user) getEvents(events, setEvents, user); // The function we just created
  }, [user]) // Dependency on user

  // Handle month grid cell click
  function monthCellClick(day, active) {
    if (active) {
      return () => {
        // alert(day);
        setView(View.WEEK);
        setDate(new Date(date.getFullYear(), date.getMonth(), day));
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
    <div className="calendar" style={{ position: 'relative' }}>
      <AuthDropdown user={user} setUser={setUser}/> {/* Login/logout dropdown */}
      {view == View.MONTH
        ? <MonthGrid date={date} setDate={setDate} handleClick={monthCellClick} events={events}/>
        : <WeekGrid date={date} setDate={setDate} events={events} setEvents={setEvents}
            backClick={() => {setView(View.MONTH)}}/>
      }
    </div>
  )
}

const View = {
  MONTH: "month",
  WEEK: "week",
}

export default Calendar
