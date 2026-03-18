import { useEffect, useMemo, useState } from 'react';

export type DayTheme = 'aube' | 'jour' | 'apresmidi' | 'soir' | 'nuit';

function getThemeByHour(hour: number): DayTheme {
  if (hour >= 5 && hour < 9) return 'aube';
  if (hour >= 9 && hour < 14) return 'jour';
  if (hour >= 14 && hour < 18) return 'apresmidi';
  if (hour >= 18 && hour < 22) return 'soir';
  return 'nuit';
}

export function useDayTheme() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const theme = useMemo(() => getThemeByHour(now.getHours()), [now]);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return { theme, now };
}
