import { useState, useEffect, useRef } from 'react'
import MonthGrid from './MonthGrid';
import { incrementMonth, decrementMonth } from './MonthGrid'
import WeekGrid from './WeekGrid';
import { supabase } from './supabase';
import { addEvents, setCompletion } from './Event';
import { getHourAndAmFromIndex } from './Util';
import { ProfileAvatar, loadProfile, saveProfile, NORMAL_PICS, PREMIUM_PICS } from './Profile';
import GachaPage from './GachaPage';

// Fetch events from Supabase and add to state
export async function getEvents(events, setEvents, user) {
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
      for (const [key, value] of Object.entries(events)) {
        events[key] = value.filter((e) => e.dbId != null);
      }
      for (let i = 0; i < data.length; i++) {
        let obj = data[i];
        let deadline = new Date(obj.deadline);
        let taskName = obj.task_name;
        let user_id = obj.user_id;
        let createdAt = obj.created_at;
        let id = obj.id;
        let hourAndAm = getHourAndAmFromIndex(deadline.getHours());
        // console.log(obj);
        // console.log(user_id);
        // console.log(username);
        // console.log(taskName);
        let completion = obj.completion;
        let exists = Object.values(events).some((day) => day.some((e) => e.dbId === id));
        console.log(exists)
        if(!exists){
          addEvents(deadline.getDate(), hourAndAm[0], deadline.getMinutes(), hourAndAm[1] ? "AM" : "PM",
            taskName, deadline.getMonth(), deadline.getFullYear(), events, setEvents, id, user_id, completion,
            false, false, 1, []);
        }
      }
      console.log(events)
    }
  } catch (error) {
    console.log(error); // If an error is caught, alert it on the client
  }
}

const ALL_PICS = [...NORMAL_PICS, ...PREMIUM_PICS];

function collectionColor(pct) {
  if (pct >= 0.90) return '#f59e0b'; // legendary
  if (pct >= 0.75) return '#a855f7'; // epic
  if (pct >= 0.50) return '#4a90d9'; // rare
  return '#aaaaaa';                   // common
}

// Login dropdown component with New User option
function AuthDropdown({ user, setUser, setEvents, profilePic, setView, xp, owned, pullCount }) {
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
      setEvents({})
    }
  }

  // Sign out user
  async function signOut(setEvents) {
    await supabase.auth.signOut() // Supabase logout
    setUser(null) // Clear user from state
    setEvents({})
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
        ? <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ProfileAvatar profilePic={profilePic} size={38} />
            <button onClick={() => {setVisible(!visible); setShowNewUserPopup(false)}}>
              {user.email}
            </button>
            {visible && (
              <div className="auth-dropdown-menu">
                {(() => {
                  const uniqueOwned = new Set(owned.filter(id => ALL_PICS.some(p => p.id === id))).size;
                  const pct = uniqueOwned / ALL_PICS.length;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}>
                      <ProfileAvatar profilePic={profilePic} size={120} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{xp} XP</span>
                        <span style={{ fontSize: '0.85rem', color: '#888', whiteSpace: 'nowrap' }}>{pullCount} rolls</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', color: collectionColor(pct) }}>
                          {uniqueOwned} / {ALL_PICS.length} collected
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <button onClick={() => { setVisible(false); setView(View.GACHA); }}>Gacha</button>
                <button onClick={() => signOut(setEvents)}>Logout</button>
              </div>
            )}
          </div>
        : <div style={{ display: 'inline-block' }}>
            <button onClick={() => {setVisible(!visible); setShowNewUserPopup(false)}}>Login</button> {/* Show login if no user */}
            <button style={{marginLeft: '6px'}} onClick={() => {setShowNewUserPopup(!showNewUserPopup); setVisible(false)}}>New User</button> {/* New user button */}
          </div>
      }
      {visible && !user && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 20,
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
          right: 20,
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
  const [xp, setXp] = useState(1500)
  const [profilePic, setProfilePic] = useState('plant')
  const [owned, setOwned] = useState(['blossom', 'plant'])
  const [pullCount, setPullCount] = useState(0)
  const profileLoaded = useRef(false)
  const initialLoadDone = useRef(false)

  // On mount: fetch user AND profile together so there's no flash of the default pfp
  useEffect(() => {
    supabase.auth.getUser().then(async res => {
      const u = res.data.user;
      if (u) {
        const p = await loadProfile(u.id);
        if (p) {
          setXp(p.xp);
          setProfilePic(p.profilePic);
          setOwned(p.owned);
          setPullCount(p.pullCount);
        }
        profileLoaded.current = true;
        initialLoadDone.current = true;
      }
      setUser(u); // set user after profile is ready to avoid the [user] effect re-loading
    });
  }, [])

  // Load profile from Supabase when user logs in interactively; reset to defaults on logout
  useEffect(() => {
    if (!user) {
      profileLoaded.current = false;
      initialLoadDone.current = false;
      setXp(1500);
      setProfilePic('plant');
      setOwned(['blossom', 'plant']);
      setPullCount(0);
      return;
    }
    if (initialLoadDone.current) return; // already loaded in mount effect
    loadProfile(user.id).then(p => {
      if (p) {
        setXp(p.xp)
        setProfilePic(p.profilePic)
        setOwned(p.owned)
        setPullCount(p.pullCount)
      }
      // If no profile (new user), defaults are already set by the logout branch above
      profileLoaded.current = true
    })
  }, [user])

  // Save profile whenever it changes
  useEffect(() => {
    if (!user || !profileLoaded.current) return
    saveProfile(user.id, { xp, profilePic, owned, pullCount })
  }, [xp, profilePic, owned, pullCount])

  // Fetch events once user is logged in
  useEffect(() => {
    if (user) getEvents(events, setEvents, user); // The function we just created
  }, [user, events]) // calls when user or events is updated
  // (add events hard coded only adds one at a time, the last one in for loop)
  // (events does not accumulate, set events does not apply until after entire loop)
  // (must call get events multiple times)

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

  if (view === View.GACHA) {
    return (
      <GachaPage
        xp={xp} setXp={setXp}
        profilePic={profilePic} setProfilePic={setProfilePic}
        owned={owned} setOwned={setOwned}
        pullCount={pullCount} setPullCount={setPullCount}
        onBack={() => setView(View.MONTH)}
      />
    )
  }

  return (
    <div className="calendar" style={{ position: 'relative' }}>
      <AuthDropdown user={user} setUser={setUser} setEvents={setEvents}
        profilePic={profilePic} setView={setView} xp={xp}
        owned={owned} pullCount={pullCount}
      />
      {view === View.MONTH
        ? <MonthGrid date={date} setDate={setDate} handleClick={monthCellClick} events={events}/>
        : <WeekGrid date={date} setDate={setDate} events={events} setEvents={setEvents}
            backClick={() => {setView(View.MONTH)}} user={user}/>
      }
    </div>
  )
}

const View = {
  MONTH: "month",
  WEEK: "week",
  GACHA: "gacha",
}

export default Calendar
