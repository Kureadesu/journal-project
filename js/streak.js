// Compute consecutive-day writing streak from a list of entries
function computeStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  // Extract unique dates (UTC) that have at least one entry
  const set = new Set();
  entries.forEach(e => {
    const t = e.timestamp;
    if (!t) return;
    // Support both Firestore Timestamp and ISO string / number
    let dateObj = null;
    if (t.toDate) dateObj = t.toDate();
    else dateObj = new Date(t);
    const dayKey = dateObj.toISOString().slice(0,10);
    set.add(dayKey);
  });

  const dates = Array.from(set).sort().reverse();
  let streak = 0;
  let cursor = new Date();
  cursor.setUTCHours(0,0,0,0);

  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    d.setUTCHours(0,0,0,0);
    const diffDays = Math.round((cursor - d) / (24*60*60*1000));
    if (diffDays === 0) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 24*60*60*1000);
    } else if (diffDays === 1) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 24*60*60*1000);
    } else {
      break;
    }
  }
  return streak;
}

export { computeStreak };
