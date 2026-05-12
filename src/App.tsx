import { useState, useMemo } from 'react'
import './App.css'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, LineChart, Line, Cell, ResponsiveContainer, Legend
} from "recharts"
import { fetchHistory, type HistoryRecord } from "./api/history"

type Resultado = {
  sentimento: string
  tema: string
  sentimentoConfianca: string
  temaConfianca: string
}

type DadoGrafico = {
  nome: string
  valor: number
  porcentagem: string
}

type ViewMode = 'analisar' | 'dias' | null
type InputType = 'link' | 'texto' | null

function isURL(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function App() {
  const [link, setLink] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [historico, setHistorico] = useState<Resultado[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>(null)

  const inputType: InputType = link.trim() === '' ? null : isURL(link.trim()) ? 'link' : 'texto'

  const [historicoDias, setHistoricoDias] = useState<Record<string, HistoryRecord[]>>({})
  const [dadosLinhaDias, setDadosLinhaDias] = useState<any[]>([])

  const CORES_SENTIMENTO: Record<string, string> = {
    positivo: "#00fe72",
    negativo: "#db1d1d",
  }

  const analisar = async () => {
    if (!link) {
      setMsg("Cole um texto primeiro")
      return
    }
    try {
      setLoading(true)
      setMsg("")
      setViewMode('analisar')
      setHistoricoDias({})
      setDadosLinhaDias([])

      const payload = inputType === 'link' ? { link } : { text: link }
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Erro no servidor")
      const data = await res.json()
      if (data.error) {
        setMsg(data.error)
        return
      }
      const prediction = data.prediction || {}
      const sentimentoRaw = (prediction.sentiment || prediction.sentimento || "").toString()

      const novoResultado: Resultado = {
        sentimento: sentimentoRaw,
        tema: (prediction.class || prediction.tema || "").toString(),
        sentimentoConfianca: (prediction.sentiment_confidence || 0).toString(),
        temaConfianca: (prediction.class_confidence || 0).toString()
      }
      setResultado(novoResultado)
      setHistorico((prev) => [...prev, novoResultado])
    } catch (error) {
      console.error(error)
      setMsg("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const analisarUltimosDias = async () => {
    try {
      setLoading(true)
      setMsg("")
      setViewMode('dias')
      setResultado(null)
      setHistorico([])

      const history = await fetchHistory()

      const agrupado: Record<string, HistoryRecord[]> = {}
      history.forEach((item: HistoryRecord) => {
        const data = item.date
        if (!agrupado[data]) agrupado[data] = []
        agrupado[data].push(item)
      })

      const ultimos5Dias = Object.keys(agrupado)
        .sort((a, b) => {
          const parseDate = (d: string) => {
            if (d.includes("/")) {
              const [dia, mes, ano] = d.split("/")
              return new Date(`${ano}-${mes}-${dia}`).getTime()
            }
            return new Date(d).getTime()
          }
          return parseDate(b) - parseDate(a)
        })
        .slice(0, 5)

      const resultadoFinal: Record<string, HistoryRecord[]> = {}
      ultimos5Dias.forEach((dia) => {
        resultadoFinal[dia] = agrupado[dia]
      })

      setHistoricoDias(resultadoFinal)

      const linha = ultimos5Dias.map((dia) => {
        let positivo = 0
        let negativo = 0
        resultadoFinal[dia].forEach((item) => {
          if (item.sentiment === "positivo") positivo++
          if (item.sentiment === "negativo") negativo++
        })
        return { dia, positivo, negativo }
      })

      setDadosLinhaDias(linha)
    } catch (error) {
      console.error(error)
      setMsg("Erro ao carregar histórico")
    } finally {
      setLoading(false)
    }
  }

  const gerarDadosTema = (dados: HistoryRecord[]) => {
    const contagem: Record<string, number> = {}
    dados.forEach((item) => {
      contagem[item.className] = (contagem[item.className] || 0) + 1
    })
    return Object.keys(contagem).map((tema) => ({
      nome: tema,
      valor: contagem[tema]
    }))
  }

  const dadosGrafico: DadoGrafico[] = useMemo(() => {
    const contagem: Record<string, number> = {}
    historico.forEach((item) => {
      contagem[item.sentimento] = (contagem[item.sentimento] || 0) + 1
    })
    const total = Object.values(contagem).reduce((a, b) => a + b, 0) || 1
    return Object.keys(contagem).map((key) => ({
      nome: key,
      valor: contagem[key],
      porcentagem: ((contagem[key] / total) * 100).toFixed(1)
    }))
  }, [historico])

  const dadosLinha = useMemo(() => {
    let positivo = 0
    let negativo = 0
    return historico
      .map((item, index) => {
        if (item.sentimento === "positivo") positivo++
        if (item.sentimento === "negativo") negativo++
        return { index: index + 1, positivo, negativo }
      })
  }, [historico])

  return (
    <section id="center">
      <div className="content">
        <h1>Analisador de Notícias</h1>

        <div className="input-group">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Digite um texto ou cole um link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            {inputType && (
              <span className={`input-badge ${inputType}`}>
                {inputType === 'link' ? 'Link' : 'Texto'}
              </span>
            )}
          </div>
          <button onClick={analisar}>Analisar</button>
          <button onClick={analisarUltimosDias}>Analisar 5 últimos dias</button>
        </div>

        {msg && <p className="mensagem">{msg}</p>}
        {loading && <p>Carregando...</p>}

        {viewMode === 'analisar' && (
          <>
            {resultado && (
              <div className={`resultado ${resultado.sentimento}`}>
                <h2>Resultado</h2>
                <p><strong>Sentimento:</strong> {resultado.sentimento}</p>
                <p><strong>Tema:</strong> {resultado.tema}</p>
                <p><strong>Confiança do Sentimento:</strong> {resultado.sentimentoConfianca}%</p>
                <p><strong>Confiança do Tema:</strong> {resultado.temaConfianca}%</p>
              </div>
            )}

            {historico.length > 0 && (
              <>
                <h2 className="titulo-estatisticas">Estatísticas</h2>
                <div className="resumo">
                  {dadosGrafico.map((item) => (
                    <p key={item.nome}>
                      {item.nome}: <strong>{item.porcentagem}%</strong>
                    </p>
                  ))}
                </div>

                <div className="graficos-container">
                  <div className="grafico">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dadosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="valor">
                          {dadosGrafico.map((entry, index) => (
                            <Cell key={index} fill={CORES_SENTIMENTO[entry.nome] ?? "#aaa"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grafico">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={dadosGrafico} dataKey="valor" nameKey="nome" outerRadius={100}>
                          {dadosGrafico.map((entry, index) => (
                            <Cell key={index} fill={CORES_SENTIMENTO[entry.nome] ?? "#aaa"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grafico">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dadosLinha}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="positivo" stroke="#00fe72" strokeWidth={3} />
                        <Line type="monotone" dataKey="negativo" stroke="#db1d1d" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        
        {viewMode === 'dias' && (
          <>
            {Object.entries(historicoDias).map(([dia, dados]) => {
              const dadosPizza = gerarDadosTema(dados)
              return (
                <div className="grafico" key={dia}>
                  <h3>{dia}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={dadosPizza}
                        dataKey="valor"
                        nameKey="nome"
                        outerRadius={100}
                        label
                      >
                        {dadosPizza.map((_, index) => (
                          <Cell key={index} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )
            })}

            {dadosLinhaDias.length > 0 && (
              <div className="grafico">
                <h2>Sentimentos por dia</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosLinhaDias}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="positivo" stroke="#00fe72" strokeWidth={3} />
                    <Line type="monotone" dataKey="negativo" stroke="#db1d1d" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  )
}



export default App