const OpenAI = require('openai');

const allowedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function rulesPlan(user, workouts, classes, bookedClasses = []) {
  const days = user.profile?.availableDays?.length ? user.profile.availableDays.slice(0, 5) : ['Monday', 'Wednesday', 'Saturday'];
  const minutes = user.profile?.preferredMinutes || 30;
  const equipment = user.profile?.equipment?.length ? user.profile.equipment.join(', ') : 'bodyweight';
  const templates = user.goal === 'Build strength'
    ? [
        ['Full-body strength builder', 'Strength', `Warm up 5 minutes. Then complete 3 rounds: 8-10 squats, 8-10 push or incline push-ups, 10 hip hinges, 10 rows using ${equipment}, and a 30-second plank. Rest 60-90 seconds between rounds. Finish with easy hip and shoulder mobility.`],
        ['Mobility and core reset', 'Mobility', 'Move slowly through 2 rounds: cat-cow, thoracic rotations, hip flexor stretch, hamstring sweep, dead bug, side plank, and deep breathing. Keep every rep pain-free and controlled.'],
        ['Progressive strength practice', 'Strength', `Warm up, then do 4 sets each: split squats, presses, rows, and glute bridges. Use ${equipment} if available. Choose a load or pace that leaves 2 reps in reserve, then cool down for 5 minutes.`]
      ]
    : user.goal === 'Lose weight'
      ? [
          ['Low-impact interval session', 'Cardio', 'Warm up 5 minutes. Alternate 1 minute brisk effort with 1 minute easy pace for 10-14 rounds. You should breathe harder but still control your form. Cool down until your breathing settles.'],
          ['Metabolic strength circuit', 'Strength', `Complete 3-4 steady rounds: squats, step-ups, rows with ${equipment}, push-ups, and farmer carry or march in place. Rest as needed so movement quality stays clean.`],
          ['Recovery walk and mobility', 'Mobility', 'Take an easy walk or cycle, then spend 10 minutes on calves, hips, chest, and back. This day should help you feel better after training, not exhausted.']
        ]
      : [
          ['Foundation workout', 'Strength', `Warm up 5 minutes. Complete 3 rounds: squat pattern, push pattern, hinge pattern, pull with ${equipment}, and core hold. Keep the effort moderate and repeatable.`],
          ['Flow and mobility', 'Mobility', 'Do a gentle mobility flow for hips, spine, shoulders, and ankles. Use slow breathing and stop before discomfort becomes pain.'],
          ['Cardio confidence', 'Cardio', 'Choose walking, cycling, jogging, or another simple cardio option. Stay at a pace where short sentences are possible, then cool down for 5 minutes.']
        ];
  const sessions = days.slice(0, Math.max(2, Math.min(4, templates.length + (workouts.length > 3 ? 1 : 0)))).map((day, index) => {
    const bookedClass = bookedClasses.find(item => item.schedule?.startsWith(day.slice(0, 3)) && !item.cancelled);
    const template = templates[index % templates.length];
    if (bookedClass) return { day, title: bookedClass.title, type: bookedClass.category, minutes: bookedClass.duration, instructions: `This is your booked class. Treat it as the main workout today: arrive 10 minutes early, warm up lightly, ask the trainer for scaling options, and finish with 5 minutes of easy cooldown.`, classId: bookedClass._id };
    return { day, title: template[0], type: template[1], minutes, instructions: `${template[2]} Progression: next week add 1 set, 2 reps, or 5 minutes only if this felt manageable.` };
  });
  const classHint = classes.length ? ' Available classes are useful extras, but this plan stands on its own.' : '';
  return { summary: `A realistic ${sessions.length}-session coaching week for your ${user.goal.toLowerCase()} goal, with specific workouts you can do even without booking more classes.${classHint}`, sessions, source: 'rules' };
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
      input: `You are FitFlow's conservative fitness consistency coach, not a class salesperson. Return JSON only with keys summary and sessions. Each session needs day, title, type, minutes, instructions. Create 2-5 safe, repeatable sessions with concrete details: warmup, main work, sets/reps or intervals, cooldown, and one simple progression cue. Include already booked classes as workouts when they match a chosen day. Do not tell the user to book unbooked classes; available classes are only context for intensity/category. Most sessions should be standalone workouts the user can do with their equipment and time. Never diagnose, prescribe rehabilitation, recommend supplements, or override medical advice. If limitations mention pain, injury, pregnancy, heart issues, or another medical concern, recommend professional clearance and keep activity gentle. User: ${JSON.stringify({ goal: user.goal, profile: user.profile })}. Recent workouts: ${JSON.stringify(workouts.slice(0, 10))}. Booked classes: ${JSON.stringify(bookedClasses.map(c => ({ id: c._id, title: c.title, category: c.category, schedule: c.schedule, duration: c.duration, level: c.level })))}. Available classes for context only: ${JSON.stringify(classes.map(c => ({ id: c._id, title: c.title, category: c.category, schedule: c.schedule, duration: c.duration, level: c.level })))}.`
    });
    const parsed = JSON.parse(response.output_text.replace(/^```json\s*|\s*```$/g, ''));
    return validPlan(parsed) ? { ...parsed, source: 'ai' } : fallback;
  } catch (error) {
    console.error(`AI coach fallback: ${error.message}`);
    return fallback;
  }
}

module.exports = { generatePlan, rulesPlan, validPlan };
