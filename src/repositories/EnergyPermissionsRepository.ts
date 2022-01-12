import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
	API_ACCESS_CLIENTS_TABLE_NAME,
	CPFL_SEARCH,
	ENERGY_PERMISSIONS_TABLE_NAME
} = require('./../database/types')

export interface EnergyPermissionsInterface {
	id: number,
	
	cpfl_search_FK: number,
	client_FK: number
}

interface createEnergyPermissionsInterface {
	cpfl_search_FK: number,

	client_FK: number
}

interface indexEnergyPermissions {
	cpfl_search_FK?: number,
	client_FK?: number
}

interface getEnergyPermissions {
	cpfl_search_FK?: number,
	client_FK?: number
}

interface deleteEnergyPermissions {
	id?: number,

	cpfl_search_FK?: number,
	client_FK?: number
}

export default class EnergyPermissionsRepository {
	private reference = () => connection<EnergyPermissionsInterface>(ENERGY_PERMISSIONS_TABLE_NAME)

	public create = async ({ cpfl_search_FK, client_FK }: createEnergyPermissionsInterface) => {
		return this.reference()
			.insert({ cpfl_search_FK, client_FK })
			.then(() => {
				return 
			})
			.catch(error => {
				throw new AppError('Database Error', 406, error.message, true)
			})
	}

	public index = async ({ cpfl_search_FK, client_FK }: indexEnergyPermissions) => {
		let query = this.reference()

		if (!!cpfl_search_FK) query = query.where('cpfl_search_FK', '=', cpfl_search_FK)
		if (!!client_FK) query = query.where('client_FK', '=', client_FK)

		return query
			.select('*')
			.then(energiesPermissions => energiesPermissions)
			.catch(error => {
				throw new AppError('Database Error', 406, error.message, true)
			})
	}

	public indexPerClients = async () => {
		return this.reference()
			.join(
				CPFL_SEARCH,
				`${CPFL_SEARCH}.id`, '=', `${ENERGY_PERMISSIONS_TABLE_NAME}.cpfl_search_FK`
			)
			.join(
				API_ACCESS_CLIENTS_TABLE_NAME,
				`${API_ACCESS_CLIENTS_TABLE_NAME}.id`, '=', `${ENERGY_PERMISSIONS_TABLE_NAME}.client_FK`
			)
			.orderBy(`${ENERGY_PERMISSIONS_TABLE_NAME}.id`)
			.select('*')
			.then(async (result) => {
				const energyPermissions = await this.reference().select('*').orderBy('id')

				// console.log(ids)
				return result.map((result, index) => {
					return {
						...result,
						id: energyPermissions[index].id
					}
				})

				return {
					result,
				}
			})
			.catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
	}

	public get = async ({ cpfl_search_FK, client_FK }: getEnergyPermissions) => {
		let query = this.reference()

		if (!!cpfl_search_FK) query = query.where('cpfl_search_FK', '=', cpfl_search_FK)
		if (!!client_FK) query = query.where('client_FK', '=', client_FK)

		return query
			.select('*')
			.first()
			.then(energyPermission => energyPermission)
			.catch(error => {
				throw new AppError('Database Error', 406, error.message, true)
			})
	}

	public delete = async ({ id, cpfl_search_FK, client_FK }: deleteEnergyPermissions) => {
		let query = this.reference()

		if (!!id) query = query.where('id', '=', id)
		if (!!cpfl_search_FK) query = query.where('cpfl_search_FK', '=', cpfl_search_FK)
		if (!!client_FK) query = query.where('client_FK', '=', client_FK)

		return query
			.delete()
			.then(() => {})
			.catch(error => {
				throw new AppError('Database Error', 406, error.message, true)
			})
	}
}