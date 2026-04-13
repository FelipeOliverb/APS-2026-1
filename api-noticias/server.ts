import express, { Request, Response } from "express"
import cors from "cors"

const app = express()
const PORT = 3000


app.use(cors())

app.use(express.json())

const intents = [
  {
    tag: "desmatamento",
    patterns: ["desmatamento", "derrubada", "floresta destruida", "amazonia"],
    sentimento: "negativo"
  },
  {
    tag: "poluicao",
    patterns: ["poluicao", "lixo", "contaminacao", "esgoto", "ar poluido"],
    sentimento: "negativo"
  },
  {
    tag: "mudancas climaticas",
    patterns: ["aquecimento global", "clima", "temperatura", "emissoes"],
    sentimento: "negativo"
  },
  {
    tag: "sustentabilidade",
    patterns: ["sustentavel", "energia limpa", "reciclagem", "preservacao"],
    sentimento: "positivo"
  }
]

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function classificar(texto: string) {
  const normalizado = normalizar(texto)

  let melhorMatch = {
    tag: "desconhecido",
    score: 0,
    sentimento: "neutro"
  }

  for (const intent of intents) {
    let score = 0

    for (const pattern of intent.patterns) {
      if (normalizado.includes(pattern)) {
        score++
      }
    }

    if (score > melhorMatch.score) {
      melhorMatch = {
        tag: intent.tag,
        score,
        sentimento: intent.sentimento
      }
    }
  }

  return melhorMatch
}

app.post("/analisar", (req: Request, res: Response) => {
  try {
    const { link } = req.body

    if (!link) {
      return res.status(400).json({
        sucesso: false,
        erro: "Link não enviado"
      })
    }

    const resultado = classificar(link)

    return res.json({
      sucesso: true,
      sentimento: resultado.sentimento,
      tema: resultado.tag
    })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      sucesso: false,
      erro: "Erro interno no servidor"
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server 2 rodando em http://localhost:${PORT}`)
})