export function getDayName(index) {
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return dayNames[index];
}

export function getHourName(index) {
  let am = true;
  if (index >= 12) {
    am = false;
    index = mod(index, 12);
  }
  index = index == 0 ? 12 : index;
  return `${index} ${am ? "AM" : "PM"}`
}

export function hashDate(date) {
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

export function mod(n, m) {
  return ((n % m) + m) % m;
}

export function getDaysInMonth(month, leapYear) {
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  return monthDays[month] + (leapYear && month == 1 ? 1 : 0);
}

export function getMonthName(month) {
  const monthNames = ['January','February','March','April','May','June','July',
    'August','September','October','November','December'];
  return monthNames[month];
}

export function isLeapYear(year) {
  return year % 400 == 0 || (year % 4 == 0 && year % 100 != 0);
}

export function getMonthOffset(month, year, leapYear) {
  const janFirstOffset = (year % 100 + Math.floor(year % 100/4)) % 7
    + (leapYear ? -1 : 0);
  const monthOffsets = [0,3,3,6,1,4,6,2,5,0,3,5];
  const result = (monthOffsets[month] + janFirstOffset) % 7;
  return result == 0 ? 7 : result;
}