const {
  DOWN_DETECTOR_ROUTINE_EXECUTION
} = require('./../types')

async function createRoutine(time, knex) {
  await knex(DOWN_DETECTOR_ROUTINE_EXECUTION)
    .where({ time: time })
    .select('*')
    .then(async (routines) => {
      const notHaveRoutine = routines.length === 0

      if (notHaveRoutine) {
        await knex(DOWN_DETECTOR_ROUTINE_EXECUTION)
          .insert({
            time,
            execution: 1
          })
      }
    })
}

exports.seed = async function seed(knex) {
  await createRoutine(1, knex)
  await createRoutine(3, knex)
  await createRoutine(5, knex)
  await createRoutine(10, knex)
  await createRoutine(15, knex)
}