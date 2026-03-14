import { getDayName, getHourName } from './Util.jsx'

function EventAdder(props) {
  const events = props.events;
  const setEvents = props.setEvents;
  return (
    <div className="eventAdder">
      <form onClick={(e) => (
          e.preventDefault()
        )}>
        <select name="Day">
          {Array.from(Array(7)).map((_, index) => (
            <option value={getDayName(index)}>{getDayName(index)}</option>
          ))}
        </select>
        <select name="Starts">
          {Array.from(Array(24)).map((_, index) => (
            <option value={getHourName(index)}>{getHourName(index)}</option>
          ))}
        </select>
        {/* <label for="eventName">Name:</label> */}
        <input type="text" name="eventName"/>
        <input type="submit" value="Add Event"/>
      </form>
    </div>
  )
}

export default EventAdder