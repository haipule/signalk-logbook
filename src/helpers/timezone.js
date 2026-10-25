// Display timezone handling for the logbook. Entries are always stored
// in UTC; these helpers only decide how they are rendered and which
// days the logbook shows.
//
// Two settings are supported:
// - 'UTC': entries are shown in UTC, timestamps suffixed with an
//   explicit Z
// - 'ship': entries are shown in ship's time without a timezone
//   specifier. Ship's time is the fixed offset published by
//   environment.time.timezoneOffset in seconds, e.g. 46800 → UTC+13.

const { DateTime } = require('luxon');

// Convert an offset in seconds into a zero-padded Luxon fixed-offset zone
// specifier: 46800 → 'UTC+13:00', -34200 → 'UTC-09:30'. Signal K offsets
// have minute precision and valid civil time zones range from UTC-12 to
// UTC+14, so reject values outside that range or between whole minutes.
function offsetToZone(seconds) {
  if (!Number.isFinite(seconds) || seconds % 60 !== 0 || Math.abs(seconds) > 14 * 60 * 60) {
    return null;
  }
  const sign = seconds < 0 ? '-' : '+';
  const totalMinutes = Math.abs(seconds) / 60;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

// Resolve the displayTimeZone setting into a concrete zone string.
// Ship's time without a received offset — and any unknown setting,
// such as IANA zones from before only these two were offered — falls
// back to UTC.
function displayZone(setting, timezoneOffset) {
  if (setting === 'ship' && Number.isFinite(timezoneOffset)) {
    return offsetToZone(timezoneOffset) || 'UTC';
  }
  return 'UTC';
}

// Timestamp per the Signal K visuals spec: ship's time carries no
// timezone specifier, UTC is explicitly suffixed with Z. Dates use
// YYYY-MM-DD.
function formatTimestamp(date, zone) {
  const dt = DateTime.fromJSDate(date).setZone(zone);
  return `${dt.toFormat('yyyy-MM-dd HH:mm:ss')}${zone === 'UTC' ? 'Z' : ''}`;
}

// Human-readable designation for a resolved display zone, matching how
// ship's time changes are worded in the log: 'UTC', 'UTC+13', 'UTC-9:30'
function zoneLabel(zone) {
  if (!zone || zone === 'UTC') {
    return 'UTC';
  }
  const offset = zone.replace(/^UTC/, '');
  const sign = offset.startsWith('-') ? '-' : '+';
  const [hours, minutes] = offset.replace(/^[+-]/, '').split(':');
  return `UTC${sign}${parseInt(hours, 10)}${minutes === '00' ? '' : `:${minutes}`}`;
}

module.exports = {
  offsetToZone,
  displayZone,
  formatTimestamp,
  zoneLabel,
};
