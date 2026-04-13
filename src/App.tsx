import { useState, useMemo } from 'react'
import './App.css'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts"

type Resultado = {
  sentimento: string
  tema: string
}

type DadoGrafico = {
  nome: string
  valor: number
  porcentagem: string
}

function App() {
  const [link, setLink] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [historico, setHistorico] = useState<Resultado[]>([])

  const CORES_SENTIMENTO: Record<string, string> = {
    positivo: "#00fe72",
    negativo: "#db1d1d",
    neutro: "#7ee5ff"
  }

  const analisar = async () => {
    if (!link) {
      setMsg("Cole um texto primeiro")
      return
    }

    try {
      setLoading(true)
      setMsg("")

      const res = await fetch("http://localhost:3000/analisar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ link })
      })

      if (!res.ok) throw new Error("Erro no servidor")

      const data = await res.json()

      if (!data.sucesso) {
        setMsg(data.erro)
        return
      }

      const novoResultado: Resultado = {
        sentimento: data.sentimento,
        tema: data.tema
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

  
  const dadosGrafico: DadoGrafico[] = useMemo(() => {
    const contagem: Record<string, number> = {}

    historico.forEach((item) => {
      contagem[item.sentimento] = (contagem[item.sentimento] || 0) + 1
    })

    const total = historico.length || 1

    return Object.keys(contagem).map((key) => ({
      nome: key,
      valor: contagem[key],
      porcentagem: ((contagem[key] / total) * 100).toFixed(1)
    }))
  }, [historico])

  return (
    <section id="center">
      <div className="content">
        <h1>Analisador de Notícias</h1>

        <div className="input-group">
          <input
            type="text"
            placeholder="Digite um texto"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <button onClick={analisar}>
            Analisar
          </button>
        </div>

        {msg && <p className="mensagem">{msg}</p>}
        {loading && <p>Carregando...</p>}

        {resultado && (
          <div className={`resultado ${resultado.sentimento}`}>
            <h2>Resultado</h2>
            <p><strong>Sentimento:</strong> {resultado.sentimento}</p>
            <p><strong>Tema:</strong> {resultado.tema}</p>
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

              
              <div className="grafico-barra">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />

                    <Tooltip
                      formatter={(_, __, props: any) => {
                        const payload = props?.payload
                        return [`${payload?.porcentagem ?? 0}%`, "Porcentagem"]
                      }}
                    />

                    <Bar dataKey="valor">
                      {dadosGrafico.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={CORES_SENTIMENTO[entry.nome]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              
              <div className="grafico-pizza">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosGrafico}
                      dataKey="valor"
                      nameKey="nome"
                      outerRadius={100}
                    >
                      {dadosGrafico.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={CORES_SENTIMENTO[entry.nome]}
                        />
                      ))}
                    </Pie>    

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default App