import raw from './tickets.json'

export interface Batch {
  id: string
  label: string
  title: string
  source: string
  intro: string
}

export interface ApiCall {
  method: string
  path: string
  note?: string
}

export interface Ticket {
  id: string
  number: string
  batch: string
  title: string
  area: string
  /** Epic name, used to group tickets on the index page. */
  group: string
  groupNote?: string
  estimate: string
  dependsOn: string
  blocked?: boolean
  summary: string
  steps?: string[]
  api?: ApiCall[]
  needs?: string
  reuse?: string[]
  notes?: string[]
  dod?: string[]
}

interface Data {
  batches: Batch[]
  tickets: Ticket[]
}

const data = raw as unknown as Data

export const batches: Batch[] = data.batches
export const tickets: Ticket[] = data.tickets

export const ticketsForBatch = (batchId: string): Ticket[] =>
  tickets.filter((ticket) => ticket.batch === batchId)

export interface Group {
  name: string
  note: string
  items: Ticket[]
}

/** Groups tickets in first-appearance order, preserving each group's note. */
export const groupsOf = (list: Ticket[]): Group[] => {
  const groups: Group[] = []
  for (const ticket of list) {
    const name = ticket.group || ticket.area
    let group = groups.find((g) => g.name === name)
    if (!group) {
      group = { name, note: ticket.groupNote ?? '', items: [] }
      groups.push(group)
    }
    group.items.push(ticket)
  }
  return groups
}