import { commercialApi } from './commercials'
import { managerApi } from './managers'
import { directeurApi } from './directeurs'
import { zoneApi } from './zones'
import { immeubleApi } from './immeubles'
import { porteApi } from './portes'
import { statisticApi, authApi } from './statistics'

export * from './commercials'
export * from './managers'
export * from './directeurs'
export * from './zones'
export * from './immeubles'
export * from './portes'
export * from './statistics'

export const api = {
  auth: authApi,
  directeurs: directeurApi,
  managers: managerApi,
  commercials: commercialApi,
  zones: zoneApi,
  immeubles: immeubleApi,
  statistics: statisticApi,
  portes: porteApi,
}

export default api
