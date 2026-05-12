export type HistoryApiItem = {
  content: string
  class: string
  sentiment: string
  class_confidence: string
  sentiment_confidence: string
  date: string
}

export type HistoryRecord = {
  content: string
  className: string
  sentiment: string
  classConfidence: string
  sentimentConfidence: string
  date: string
}

const DEFAULT_BASE_URL = "http://localhost:5000"

export async function fetchHistory(baseUrl = DEFAULT_BASE_URL): Promise<HistoryRecord[]> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "")
  const response = await fetch(`${normalizedBaseUrl}/history`)

  if (!response.ok) {
    throw new Error(`Falha ao carregar histórico: ${response.status}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error("Formato de histórico inválido")
  }

  return data.map((item) => {
    const historyItem = item as Partial<HistoryApiItem>

    return {
      content: historyItem.content ?? "",
      className: historyItem.class ?? "",
      sentiment: historyItem.sentiment ?? "",
      classConfidence: historyItem.class_confidence ?? "",
      sentimentConfidence: historyItem.sentiment_confidence ?? "",
      date: historyItem.date ?? ""
    }
  })
}