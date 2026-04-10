import { useState, useEffect, useRef } from 'react'
import MonthGrid from './MonthGrid';
import { incrementMonth, decrementMonth } from './MonthGrid'
import WeekGrid from './WeekGrid';
import { supabase } from './supabase';
import { addEvents, setCompletion } from './Event';
import { getHourAndAmFromIndex } from './Util';
import { ProfileAvatar, loadProfile, saveProfile, NORMAL_PICS, PREMIUM_PICS } from './Profile';
import GachaPage from './GachaPage';

// Check for completed tasks past their deadline that haven't been cashed out yet.
// Awards 25 XP per qualifying task and marks them as cashed out.
export async function cashOutTasks(user, setXp) {
  if (!user) return;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('completion', true)
      .eq('cashedout', false)
      .lt('deadline', now);
    if (error) throw error;
    if (!data || data.length === 0) return;

    const ids = data.map(t => t.id);
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ cashedout: true })
      .in('id', ids);
    if (updateError) throw updateError;

    const xpGained = data.length * 25;
    setXp(prev => prev + xpGained);
  } catch (error) {
    console.log('cashOutTasks error:', error);
  }
}

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
      events = { ...events };
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '6px' }}>
                      <ProfileAvatar profilePic={profilePic} size={96} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{xp} XP</span>
                        <span style={{ fontSize: '0.7rem', color: '#888', whiteSpace: 'nowrap' }}>{pullCount} rolls</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', color: collectionColor(pct) }}>
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
  const [normalPullCount, setNormalPullCount] = useState(0)
  const [premiumPullCount, setPremiumPullCount] = useState(0)
  const [normal5Draw, setNormal5Draw] = useState(true)
  const [premium5Draw, setPremium5Draw] = useState(true)
  const profileLoaded = useRef(false)
  const totalPullCount = normalPullCount + premiumPullCount

  // On mount, get user from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(res => setUser(res.data.user))
  }, [])

  // Load profile from Supabase when user logs in; reset to defaults on logout
  useEffect(() => {
    if (!user) {
      profileLoaded.current = false;
      setXp(1500);
      setProfilePic('plant');
      setOwned(['blossom', 'plant']);
      setNormalPullCount(0);
      setPremiumPullCount(0);
      setNormal5Draw(true);
      setPremium5Draw(true);
      return;
    }

    loadProfile(user.id).then(p => {
      if (p) {
        setXp(p.xp)
        setProfilePic(p.profilePic)
        setOwned(p.owned)
        const savedNormal = Number(localStorage.getItem(`normalPullCount:${user.id}`));
        const savedPremium = Number(localStorage.getItem(`premiumPullCount:${user.id}`));
        setNormalPullCount(Number.isFinite(savedNormal) ? savedNormal : 0);
        setPremiumPullCount(Number.isFinite(savedPremium) ? savedPremium : 0);
      }
      // If no profile (new user), defaults are already set by the logout branch above
      profileLoaded.current = true
      // Cash out any completed tasks whose deadlines have passed
      cashOutTasks(user, setXp)
    })
  }, [user])

  // Save profile whenever it changes
  useEffect(() => {
    if (!user || !profileLoaded.current) return
    saveProfile(user.id, { xp, profilePic, owned, pullCount: totalPullCount })
    localStorage.setItem(`normalPullCount:${user.id}`, String(normalPullCount));
    localStorage.setItem(`premiumPullCount:${user.id}`, String(premiumPullCount));
  }, [user, xp, profilePic, owned, normalPullCount, premiumPullCount, totalPullCount])

  // Fetch events once user is logged in, and cash out qualifying tasks
  useEffect(() => {
    if (user) {
      getEvents(events, setEvents, user);
      if (profileLoaded.current) cashOutTasks(user, setXp);
    }
  }, [user, events]) // calls when user or events is updated
  // (add events hard coded only adds one at a time, the last one in for loop)
  // (events does not accumulate, set events does not apply until after entire loop)
  // (must call get events multiple times)

  // Poll every 30s to cash out tasks whose deadlines just passed
  useEffect(() => {
    if (!user || !profileLoaded.current) return;
    const interval = setInterval(() => cashOutTasks(user, setXp), 30000);
    return () => clearInterval(interval);
  }, [user, profileLoaded.current])

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
        normalPullCount={normalPullCount} setNormalPullCount={setNormalPullCount}
        premiumPullCount={premiumPullCount} setPremiumPullCount={setPremiumPullCount}
        normal5Draw={normal5Draw} setNormal5Draw={setNormal5Draw}
        premium5Draw={premium5Draw} setPremium5Draw={setPremium5Draw}
        onBack={() => setView(View.MONTH)}
      />
    )
  }

  return (
    <div className="calendar" style={{ position: 'relative' }}>
      <AuthDropdown user={user} setUser={setUser} setEvents={setEvents}
        profilePic={profilePic} setView={setView} xp={xp}
        owned={owned} pullCount={totalPullCount}
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
