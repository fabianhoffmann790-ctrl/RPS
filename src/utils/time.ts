import { addMinutes, differenceInMinutes, format } from 'date-fns';

export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

export const calcRangeEnd = (startIso: string, durationMinutes: number): string =>
  addMinutes(new Date(startIso), durationMinutes).toISOString();

export const overlap = (
  aStartIso: string,
  aEndIso: string,
  bStartIso: string,
  bEndIso: string,
): boolean => {
  const aStart = new Date(aStartIso).getTime();
  const aEnd = new Date(aEndIso).getTime();
  const bStart = new Date(bStartIso).getTime();
  const bEnd = new Date(bEndIso).getTime();
  return aStart < bEnd && bStart < aEnd;
};

export const rangeDurationMin = (startIso: string, endIso: string): number =>
  Math.max(0, differenceInMinutes(new Date(endIso), new Date(startIso)));

export const formatDateTime = (iso: string): string => format(new Date(iso), 'dd.MM.yyyy HH:mm');
