export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const calculateTimeLeft = (targetMonth: number, targetDay: number): TimeLeft => {
  const now = new Date();
  let targetYear = now.getFullYear();
  
  // Note: Month is 0-indexed in JS Date (0 = Jan, 6 = July)
  let targetDate = new Date(targetYear, targetMonth, targetDay);

  // If the date has already passed this year, set target to next year
  if (now.getTime() > targetDate.getTime()) {
    targetYear += 1;
    targetDate = new Date(targetYear, targetMonth, targetDay);
  }

  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export const getNextAnniversaryDateString = (targetMonth: number, targetDay: number): string => {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetDate = new Date(targetYear, targetMonth, targetDay);
  
    if (now.getTime() > targetDate.getTime()) {
      targetYear += 1;
    }
    return new Date(targetYear, targetMonth, targetDay).toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};