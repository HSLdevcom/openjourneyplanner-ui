import moment from 'moment';

export const TIME_PATTERN = 'HH:mm';
export const DATE_PATTERN = 'dd D.M.';

// converts the given parameter into a string in format HHmm
// Input: time - seconds since midnight
export function getStartTime(time) {
  const hours = `0${Math.floor(time / 60 / 60)}`.slice(-2);
  const mins = `0${(time / 60) % 60}`.slice(-2);
  return hours + mins;
}

/**
 * Returns true if startTime is the next day compared to refTime and refTime is some time in current day
 */
export function isTomorrow(startTime, refTime) {
  const now = refTime ? moment(refTime) : moment();
  const start = moment(startTime);
  return (
    now.clone().add(1, 'day').days() === start.days() &&
    moment().days() === now.days()
  );
}

// renders trip duration to string
// input: time duration - milliseconds
export function durationToString(inDuration) {
  const duration = moment.duration(inDuration);
  if (duration.asHours() >= 1) {
    return `${
      duration.hours() + duration.days() * 24
    } h ${duration.minutes()} min`;
  }
  if (duration.minutes() < 1) {
    return `< 1 min`;
  }

  return `${duration.minutes()} min`;
}

/**
 * Returns date or '' if same day as reference
 */
export const dateOrEmpty = (time, refTime) => {
  if (new Date(time).getDay() === new Date(refTime).getDay()) {
    return '';
  }
  return moment(time).format(DATE_PATTERN);
};

/**
 * The default number of days to include to the service time range from the past.
 */
export const RANGE_PAST = 7;

export const validateServiceTimeRange = (
  itineraryFutureDays,
  serviceTimeRange,
  now,
) => {
  const NOW = now ? moment.unix(now) : moment();
  const RANGE_FUTURE = !itineraryFutureDays ? 30 : itineraryFutureDays;
  const START = NOW.clone().subtract(RANGE_PAST, 'd').unix();
  const END = NOW.clone().add(RANGE_FUTURE, 'd').unix();
  const NOWUX = NOW.unix();

  if (!serviceTimeRange) {
    // empty param returns a default range
    return {
      start: START,
      end: END,
    };
  }

  // always include today!
  let start = Math.min(Math.max(serviceTimeRange.start, START), NOWUX);
  // make sure whole day is included, for comparing timestamps
  start = moment.unix(start).startOf('day').unix();

  let end = Math.max(Math.min(serviceTimeRange.end, END), NOWUX);
  end = moment.unix(end).endOf('day').unix();

  return { start, end };
};

// converts the given parameter into a string in format HH:mm
// Input: time - seconds since midnight
export function getStartTimeWithColon(time) {
  const hours = `0${Math.floor(time / 60 / 60)}`.slice(-2);
  const mins = `0${(time / 60) % 60}`.slice(-2);
  return `${hours}:${mins}`;
}

export function getCurrentSecs() {
  return moment().unix();
}

// converts time from 24+ hour HHmm to 24 hour HH:mm format
export function convertTo24HourFormat(time) {
  if (time.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
    return time;
  }
  return parseInt(time.substring(0, 2), 10) > 23
    ? `0${parseInt(time.substring(0, 2), 10) - 24}:${time.substring(2, 4)}`
    : `${time.substring(0, 2)}:${time.substring(2, 4)}`;
}

/**
 * Returns true if startTime is the same day compared to refTime and refTime is some time in current day
 */
export function isToday(startTime, refTime) {
  const now = refTime ? moment(refTime) : moment();
  const start = moment(startTime);
  return start.isSame(now, 'day');
}

/**
 * Returns formatted date / time
 */
export function getFormattedTimeDate(startTime, pattern) {
  return moment(startTime).format(pattern);
}

/**
 * Epoch ms to 'hh:mm'
 */
export function epochToTime(ms, config) {
  const time = new Date(ms).toLocaleTimeString('en-GB', {
    timeZone: config.timeZone,
  });
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
}

/**
 * Unix time (from epoch milliseconds if given)
 */
export function unixTime(ms) {
  const t = ms || Date.now();
  return Math.floor(t / 1000);
}

/**
 * Unix to 'YYYYMMDD'
 */
export function unixToYYYYMMDD(s, config) {
  const date = new Date(s * 1000).toLocaleDateString('en-GB', {
    timeZone: config.timeZone,
  });
  const parts = date.split('/');
  return `${parts[2]}${parts[1]}${parts[0]}`;
}

/**
 * ISO-8601/RFC3339 datetime str to 'hh:mm'
 */
export function timeStr(dateTime) {
  // e.g. "2024-06-13T14:30+03:00"
  const parts = dateTime.split('T');
  const time = parts[1].split(':');
  return `${time[0]}:${time[1]}`;
}

/**
 * Epoch ms to ISO-8601/RFC3339 datetime str
 */
export function epochToIso(ms) {
  return moment(ms).format();
}
