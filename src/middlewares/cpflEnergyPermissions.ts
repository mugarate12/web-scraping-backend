import { Request, Response, NextFunction } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

import {
	cpflSearchRepository,
	energyPermissionsRepository,
	clientsAccessRepository,
	permissionsRepository
} from './../repositories'

function convertStateToProprierty(state: string) {
	if (state === 'paulista' || state === 'sp') {
		return 'paulista'
	} else if (state === 'santa cruz' || state === 'sc') {
		return 'santa cruz'
	} else if (state === 'piratininga' || state === 'pt') {
		return 'piratininga'
	} else {
		return 'rio grande do sul'
	}
}

export default async function CPFLEnergyPermissions(req: Request, res: Response, next: NextFunction) {
	const userID = Number(res.getHeader('userID'))
	const { state, city } = req.params

	let identifiers: {
		state?: string,
		city?: string
	} = {}

	console.log('propriedades: ', userID, state, city)

	if (!!state) identifiers.state = convertStateToProprierty(state)
	if (!!city) identifiers.city = city

	const search = await cpflSearchRepository.get({
		...identifiers,
		dealership: 'cpfl',
	})

	console.log('search:', search)

	let apiAccess = false
	if (!!search) {
		await energyPermissionsRepository.get({
			client_FK: userID,
			cpfl_search_FK: search.id
		})
			.then((energyPermission) => {
				console.log('energy permission', energyPermission)
				if (!!energyPermission) {
					apiAccess = true
				}
			})
	}

	if (state === 'all') {
		apiAccess = true
	}

	if (!apiAccess) {
		return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
	} else {
		return next()
	}
}