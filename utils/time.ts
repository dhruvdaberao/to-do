
export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isAnniversary: boolean;
}

export const calculateTimeLeft = (targetISO: string): TimeLeft => {
  const now = new Date();
  const targetDate = new Date(targetISO);
  
  // If we just want to track "July 6th" every year (Legacy mode)
  // But now we support specific targetISO from the dashboard.
  // If the target is in the past, we assume it's a "countdown to a specific moment".
  // However, for an anniversary app, usually we want it to repeat.
  
  // Logic: If target is in past, add years until it's in future? 
  // For this specific request ("countdown with time"), let's treat the targetISO as the absolute target.
  
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    // Check if it's within 24 hours (Anniversary Day)
    const isToday = Math.abs(difference) < (24 * 60 * 60 * 1000);
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isAnniversary: isToday };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isAnniversary: false
  };
};

export const formatDateDisplay = (targetISO: string): string => {
    if (!targetISO) return "Loading...";
    const date = new Date(targetISO);
    return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
