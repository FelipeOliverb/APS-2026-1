import { useState } from 'react'
import './App.css'

type Resultado = {
  sentimento: string
  tema: string
}

function App() {
  const [link, setLink] = useState<string>('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [msg, setMsg] = useState<string>('')

  const analisar = async () => {
    if (!link) {
      setMsg("Cole um link primeiro")
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

      const data: Resultado = await res.json()

      setResultado(data)
    } catch (error) {
      setMsg("Erro ao analisar notícia")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="center">
      <div className="content">
        <h1>Analisador de Notícias</h1>
        <p>Cole o link abaixo</p>

        <div className="input-group">
          <input
            type="text"
            placeholder="Cole o link da notícia"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <button onClick={analisar}>
            Analisar
          </button>
        </div>

        {msg && <p className="mensagem">{msg}</p>}

        {loading && <p className="loading">Analisando notícia...</p>}

        {resultado && (
          <div className={`resultado ${resultado.sentimento}`}>
            <h2>Resultado</h2>

            <p>
              <strong>Sentimento:</strong> {resultado.sentimento}
            </p>

            <p>
              <strong>Tema:</strong> {resultado.tema}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default App