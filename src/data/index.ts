import raw from './tickets.json'

export interface Batch {
  id: string
  label: string
  title: string
  source: string
  intro: string
}

export interface Ticket {
  id: string
  number: string
  batch: string
  title: string
  area: string
  group: string
  estimate: string
  dependsOn: string
  summary: string
  why?: string
  see?: string
  files?: string[]
  how?: string
  dod?: string[]
  verify?: string
  links?: string[]
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

export const ticketById = (id: string): Ticket | undefined =>
  tickets.find((ticket) => ticket.id === id.toUpperCase())

export const hoursFor = (list: Ticket[]): number =>
  list.reduce((total, ticket) => total + (parseFloat(ticket.estimate) || 0), 0)

export const areasOf = (list: Ticket[]): string[] => {
  const seen: string[] = []
  for (const ticket of list) if (!seen.includes(ticket.area)) seen.push(ticket.area)
  return seen
}