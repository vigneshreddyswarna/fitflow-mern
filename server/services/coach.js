const OpenAI = require('openai');

const allowedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function rulesPlan(user, workouts, classes, bookedClasses = []) {
  const days = user.profile?.availableDays?.length ? user.profile.availableDays.slice(0, 5) : ['Monday', 'Wednesday', 'Saturday'];
  const minutes = user.profile?.preferredMinutes || 30;
  const templates = user.goal === 'Build strength'
    ? [['Full-body foundation', 'Strength'], ['Mobility reset', 'Mobility'], ['Progressive strength', 'Strength']]
    : user.goal === 'Lose weight'
      ? [['Brisk intervals', 'Cardio'], ['Full-body circuit', 'Strength'], ['Recovery flow', 'Mobility']]
      : [['Foundation workout', 'Strength'], ['Flow and mobility', 'Mobility'], ['Cardio confidence', 'Cardio']];
  const sessions = days.slice(0, Math.max(2, Math.min(4, templates.length + (workouts.length > 3 ? 1 : 0)))).map((day, index) => {
    const bookedClass = bookedClasses.find(item => item.schedule?.startsWith(day.slice(0, 3)) && !item.cancelled);
    const nearbyClass = bookedClass || classes.find(item => item.schedule?.startsWith(day.slice(0, 3)) && !item.cancelled);
    const template = templates[index % templates.length];
    return { day, title: nearbyClass?.title || template[0], type: nearbyClass?.category || template[1], minutes: nearbyClass?.duration || minutes, instructions: nearbyClass ? `${bookedClass ? 'Attend your booked' : 'Book this'} trainer-led ${nearbyClass.level.toLowerCase()} class and arrive 10 minutes early.` : `${minutes} minutes at a comfortable, repeatable effort. Stop if you feel pain.`, classId: nearbyClass?._id };
  });
  return { summary: `A realistic ${sessions.length}-session week built around your ${user.goal.toLowerCase()} goal${bookedClasses.length ? ' and your booked classes' : ''}.`, sessions, source: 'rules' };
}

function validPlan(plan) {
  return plan && typeof plan.summary === 'string' && Array.isArray(plan.sessions) && plan.sessions.length >= 2 && plan.sessions.length <= 5 && plan.sessions.every(s => allowedDays.includes(s.day) && s.title && s.type && Number.isFinite(s.minutes) && s.minutes >= 10 && s.minutes <= 180 && s.instructions);
}

async function generatePlan(user, workouts, classes, bookedClasses = []) {
  const fallback = rulesPlan(user, workouts, classes, bookedClasses);
  if (!process.env.OPENAI_API_KEY) return fallback;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: `You are FitFlow's conservative fitness consistency coach. Return JSON only with keys summary and sessions. Each session needs day, title, type, minutes, instructions. Create 2-5 safe, repeatable sessions. Prioritize already booked classes, then suggest useful available classes, then fill gaps with safe solo work. Never diagnose, prescribe rehabilitation, recommend supplements, or override medical advice. If limitations mention pain, injury, pregnancy, heart issues, or another medical concern, recommend professional clearance and keep activity gentle. User: ${JSON.stringify({ goal: user.goal, profile: user.profile })}. Recent workouts: ${JSON.stringify(workouts.slice(0, 10))}. Booked classes: ${JSON.stringify(bookedClasses.map(c => ({ id: c._id, title: c.title, category: c.category, schedule: c.schedule, duration: c.duration, level: c.level })))}. Available classes: ${JSON.stringify(classes.map(c => ({ id: c._id, title: c.title, category: c.category, schedule: c.schedule, duration: c.duration, level: c.level })))}.`
    });
    const parsed = JSON.parse(response.output_text.replace(/^```json\s*|\s*```$/g, ''));
    return validPlan(parsed) ? { ...parsed, source: 'ai' } : fallback;
  } catch (error) {
    console.error(`AI coach fallback: ${error.message}`);
    return fallback;
  }
}

module.exports = { generatePlan, rulesPlan, validPlan };
