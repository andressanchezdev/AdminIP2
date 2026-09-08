import { getPublishedLandingTeam, type LandingTeamGroup, type LandingTeamMember } from '@/mocks/data'
import { editDistance } from './matchIntent'
import { stripAccents } from './normalizeText'

const ROLE_WORDS: Record<LandingTeamGroup, readonly string[]> = {
  asesor: ['asesor', 'asesores', 'asesora', 'asesoras'],
  administrativo: ['administrativo', 'administrativos', 'administrativa', 'administrativas','admin','admins','administra','administrador','administradoras','administradora'],
}

const ALL_ROLE_WORDS = new Set([...ROLE_WORDS.asesor, ...ROLE_WORDS.administrativo])
const FILLER = new Set(['hablar', 'contactar', 'contacto', 'equipo', 'mostrar', 'lista', 'quienes','quien', 'hay','quien es','quienes son', 'nuestro'])

export type TeamMatch =
  | { type: 'member'; members: LandingTeamMember[] }
  | { type: 'group'; group: LandingTeamGroup; members: LandingTeamMember[] }
  | { type: 'suggest'; asked: string; member: LandingTeamMember }
  | null

function plain(value: string) {
  return stripAccents(value.toLowerCase())
}

function nameParts(member: LandingTeamMember) {
  return plain(member.fullName)
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2)
}

export function publishedTeam() {
  return [...getPublishedLandingTeam('asesor'), ...getPublishedLandingTeam('administrativo')]
}

export function groupLabel(group: LandingTeamGroup) {
  return group === 'asesor' ? 'Asesores' : 'Administrativos'
}

function exactMembers(tokens: readonly string[]) {
  const team = publishedTeam()
  return team.filter((member) => {
    const parts = nameParts(member)
    const full = plain(member.fullName).replace(/\s+/g, '')
    return tokens.some((token) => parts.includes(token) || full === token)
  })
}

function closestMember(token: string) {
  if (token.length < 5) return null
  let best: LandingTeamMember | null = null
  let bestDistance = 2
  for (const member of publishedTeam()) {
    for (const part of nameParts(member)) {
      if (Math.abs(part.length - token.length) > 1) continue
      const distance = editDistance(token, part)
      if (distance === 0) return null
      if (distance < bestDistance) {
        best = member
        bestDistance = distance
      } else if (distance === bestDistance && best && best.id !== member.id) {
        return null
      }
    }
  }
  return bestDistance === 1 ? best : null
}

export function matchLandingTeam(tokens: readonly string[]): TeamMatch {
  const cleaned = tokens.map(plain).filter((token) => token.length > 2 && !ALL_ROLE_WORDS.has(token))
  const exact = exactMembers(cleaned)
  if (exact.length > 0) return { type: 'member', members: exact }

  const roleGroups = (Object.keys(ROLE_WORDS) as LandingTeamGroup[]).filter((group) =>
    tokens.some((token) => ROLE_WORDS[group].includes(plain(token))),
  )
  const leftover = cleaned.filter((token) => !FILLER.has(token))
  if (roleGroups.length === 1 && leftover.length === 0) {
    const group = roleGroups[0]
    return { type: 'group', group, members: getPublishedLandingTeam(group) }
  }

  if (cleaned.length === 1) {
    const near = closestMember(cleaned[0])
    if (near) return { type: 'suggest', asked: cleaned[0], member: near }
  }

  return null
}
