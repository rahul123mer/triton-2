import { useQuery } from '@tanstack/react-query'
import { authApi } from '../lib/api'

export function usePrincipal() {
  const query = useQuery({ queryKey: ['principal'], queryFn: authApi.me, staleTime: 5 * 60_000 })
  const permissions = new Set(query.data?.permissions || [])
  return {
    ...query,
    principal: query.data,
    can: permission => permissions.has(permission),
  }
}
