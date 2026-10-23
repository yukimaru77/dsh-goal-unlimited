// No round cap on goals: every goal's maxGoalRounds is raised to the largest
// value DSH accepts, including goals created with an explicit cap (the
// create_goal tool lets the model pick one) and goals already in a session.
export const name = 'goal-unlimited'
export const inject = ['agents', 'goals']

/** The largest round cap DSH accepts (it must be a positive safe integer). */
export const UNLIMITED = Number.MAX_SAFE_INTEGER

export function apply(ctx) {
  const log = (message) => ctx.logger?.warn?.(`goal-unlimited: ${message}`)

  function lift(agent) {
    let goal
    try { goal = ctx.goals.get(agent) } catch { return }
    if (goal === undefined || goal.phase === 'complete' || goal.maxGoalRounds >= UNLIMITED) return
    try {
      ctx.goals.edit(agent, { id: goal.id, revision: goal.revision }, { maxGoalRounds: UNLIMITED })
    } catch (error) {
      log(`could not lift the round cap of goal "${goal.id}": ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Goal changes are committed to the session log, which cannot take another
  // append while it publishes one, so the edit runs after the current dispatch.
  const later = (agent) => setTimeout(() => { if (ctx.agents.get(agent.id) === agent) lift(agent) }, 0)
  ctx.on('goal/changed', ({ agent }) => later(agent))
  ctx.on('agent/created', ({ agent }) => later(agent))
  for (const agent of ctx.agents.list?.() ?? []) later(agent)
}
