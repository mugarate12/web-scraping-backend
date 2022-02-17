const {
  NFE_FAZENDA_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
  await knex.schema.createTable(NFE_FAZENDA_TABLE_NAME, (table) => {
    table.increments('id').notNullable()
    
    table.string('autorizador', 191).unique().notNullable()

    table.string('update_time').notNullable()

    table.integer('autorizacao').notNullable()
    table.integer('retorno_autorizacao').notNullable()
    table.integer('inutilizacao').notNullable()
    table.integer('consulta_protocolo').notNullable()
    table.integer('status_servico').notNullable()
    table.string('tempo_medio').notNullable()
    table.integer('consulta_cadastro').notNullable()
    table.integer('recepcao_evento').notNullable()
	})
}

exports.down = function(knex) {
	return knex.schema.dropTable(NFE_FAZENDA_TABLE_NAME)
}
