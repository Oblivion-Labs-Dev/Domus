export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  title: string;
}

function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  nth: number
): string {
  const first = new Date(year, monthIndex, 1);
  const diff = (weekday - first.getDay() + 7) % 7;
  const day = 1 + diff + (nth - 1) * 7;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number
): string {
  const last = new Date(year, monthIndex + 1, 0);
  const diff = (last.getDay() - weekday + 7) % 7;
  const day = last.getDate() - diff;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPublicHolidaysForYear(year: number): PublicHoliday[] {
  return [
    { date: `${year}-01-01`, title: "New Year's Day" },
    { date: nthWeekdayOfMonth(year, 0, 1, 3), title: "MLK Jr. Day" },
    { date: `${year}-02-14`, title: "Valentine's Day" },
    { date: nthWeekdayOfMonth(year, 1, 1, 3), title: "Presidents' Day" },
    { date: `${year}-03-17`, title: "St. Patrick's Day" },
    { date: nthWeekdayOfMonth(year, 4, 0, 2), title: "Mother's Day" },
    { date: lastWeekdayOfMonth(year, 4, 1), title: "Memorial Day" },
    { date: nthWeekdayOfMonth(year, 5, 0, 3), title: "Father's Day" },
    { date: `${year}-06-19`, title: "Juneteenth" },
    { date: `${year}-07-04`, title: "Independence Day" },
    { date: nthWeekdayOfMonth(year, 8, 1, 1), title: "Labor Day" },
    { date: `${year}-10-31`, title: "Halloween" },
    { date: `${year}-11-11`, title: "Veterans Day" },
    { date: nthWeekdayOfMonth(year, 10, 4, 4), title: "Thanksgiving" },
    { date: `${year}-12-24`, title: "Christmas Eve" },
    { date: `${year}-12-25`, title: "Christmas Day" },
    { date: `${year}-12-31`, title: "New Year's Eve" },
  ];
}
