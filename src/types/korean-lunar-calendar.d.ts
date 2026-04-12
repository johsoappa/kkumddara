declare module "korean-lunar-calendar" {
  interface CalendarDate {
    year: number;
    month: number;
    day: number;
    intercalation?: boolean;
  }
  class KoreanLunarCalendar {
    setLunarDate(year: number, month: number, day: number, isLeapMonth: boolean): void;
    setSolarDate(year: number, month: number, day: number): void;
    getSolarCalendar(): CalendarDate;
    getLunarCalendar(): CalendarDate;
  }
  export default KoreanLunarCalendar;
}
