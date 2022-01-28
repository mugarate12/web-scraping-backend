const {
	OCR_SERVICES
} = require('./../types')

exports.up = async function(knex) {
	await knex(OCR_SERVICES)
    .insert([
      {
        pix_name: 'Algar CENESP',
        state: 'SP',
        city: 'São Paulo',
        able: 1
      },
      {
        pix_name: 'Equinox-SP4',
        state: 'SP',
        city: 'São Paulo',
        able: 1
      },
      {
        pix_name: 'Level 3 CenturyLink',
        state: 'SP',
        city: 'São Paulo',
        able: 1
      },
      {
        pix_name: 'Equinix-SP2',
        state: 'SP',
        city: 'São Paulo',
        able: 1
      },
      
      {
        pix_name: 'DBUG',
        state: 'PR',
        city: 'Curitiba',
        able: 1
      },
      {
        pix_name: 'CenturyLink',
        state: 'PR',
        city: 'Curitiba',
        able: 1
      },
      
      {
        pix_name: 'Nossa Telecom',
        state: 'RS',
        city: 'Porto Alegre',
        able: 1
      },
    ])
}

exports.down = function(knex) {
}