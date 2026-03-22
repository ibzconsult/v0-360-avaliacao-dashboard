"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

const salespeople = ["Altevir Ferezin", "Diane Pimentel", "Juliana Viana", "Paula Nogueira", "Renágela Araújo"]

const evaluationQuestions = [
  {
    category: "Visão de Negócios",
    topic: "Conhecimento de Portfólio (Trust Control)",
    questions: [
      "Sei mapear a dor do cliente e posicionar corretamente as ofertas da Trust (SOC, Firewall NG/SASE, EDR/Endpoint, Gestão de Vulnerabilidades, IAM, Backup/DR), apresentando argumentos objetivos de valor e risco mitigado.",
    ],
  },
  {
    category: "Visão de Negócios",
    topic: "Conhecimento do Mercado de Cibersegurança",
    questions: [
      "Conheço o ecossistema (fabricantes, concorrentes, canais) e entendo como compram CISOs/CIOs/Infra/Compras, seus motivadores (compliance, risco, custo total) e influenciadores técnicos.",
    ],
  },
  {
    category: "Visão de Negócios",
    topic: "Tendências e Compliance",
    questions: [
      "Acompanho tendências (SASE, Zero Trust, XDR, IA em SecOps), mudanças regulatórias (LGPD, BACEN, ANS, ANEEL etc.) e eventos de segurança que afetam timing e prioridade de compra.",
    ],
  },

  {
    category: "Conhecimento de Vendas",
    topic: "Prospecção, ABM e Acompanhamento",
    questions: [
      "Consigo abrir portas em contas-alvo (ABM), personalizar a abordagem por vertical e manter follow-up disciplinado até gerar reunião técnica qualificada (MQL → SQL).",
    ],
  },
  {
    category: "Conhecimento de Vendas",
    topic: "Qualificação e Descoberta",
    questions: [
      "Conduzo descoberta estruturada (maturidade, superfícies de ataque, gaps de compliance, urgência, orçamento, autoridade) para definir próximo passo claro (diagnóstico, PoC, workshop).",
    ],
  },
  {
    category: "Conhecimento de Vendas",
    topic: "Gestão de PoC e Proposta de Valor",
    questions: [
      "Oriento PoCs com hipótese de valor e critérios de sucesso, coleto evidências (métricas/logs) e traduzo o resultado técnico em impacto de negócio na proposta.",
    ],
  },
  {
    category: "Conhecimento de Vendas",
    topic: "Contorno de Objeções",
    questions: [
      "Endereço objeções típicas (preço vs risco, esforço de implantação, lock-in, integração, SOC 24x7) com provas (cases, ROI/TCO, referências, arquitetura).",
    ],
  },
  {
    category: "Conhecimento de Vendas",
    topic: "Conclusão da Venda",
    questions: [
      "Crio senso de urgência legítimo (compliance, janela orçamentária, risco) e conduzo o fechamento com segurança até a assinatura do contrato.",
    ],
  },

  {
    category: "Relacionamento Interpessoal",
    topic: "Relacionamento com Stakeholders",
    questions: [
      "Navego bem entre técnico e executivo (Analista/Coord. de Infra, CISO/CIO, Compras, Compliance), ajustando linguagem e construindo consenso para decisão.",
    ],
  },
  {
    category: "Relacionamento Interpessoal",
    topic: "Coordenação Interna",
    questions: [
      "Orquestro pré-vendas, fabricantes e canais, garantindo alinhamento de escopo, prazos e responsabilidades, com repasses claros.",
    ],
  },
  {
    category: "Relacionamento Interpessoal",
    topic: "Clareza e Documentação",
    questions: [
      "Comunico com clareza (resumos executivos, próximos passos, riscos) e deixo o cliente sempre ciente do status.",
    ],
  },

  {
    category: "Autogestão",
    topic: "Planejamento de Carteira e Rotina",
    questions: [
      "Planejo visitas/reuniões e reviso a carteira periodicamente (A/B/C), priorizando contas com maior probabilidade de avanço e expansão.",
    ],
  },
  {
    category: "Autogestão",
    topic: "Aprendizado Contínuo",
    questions: [
      "Mantenho rotina de estudo técnico/comercial (fabricantes, releases, integrações, casos de uso) e treino apresentações e demos.",
    ],
  },
  {
    category: "Autogestão",
    topic: "Uso do CRM (Ploomes) e Dados",
    questions: [
      "Registro interações, próximos passos e métricas no Ploomes com qualidade, utilizo relatórios para priorização e preencho campos críticos (fase, valor, probabilidade, data prevista).",
    ],
  },
]

const ratingOptions = [
  { value: "1", label: "Discordo totalmente" },
  { value: "2", label: "Discordo parcialmente" },
  { value: "3", label: "Nem concordo e nem discordo" },
  { value: "4", label: "Concordo parcialmente" },
  { value: "5", label: "Concordo totalmente" },
]

const categoryIcons = {
  "Visão de Negócios": "📊",
  "Conhecimento de Vendas": "📅",
  "Relacionamento Interpessoal": "🤝🏻",
  Autogestão: "🧭",
}

export default function EvaluationPage() {
  const [step, setStep] = useState("type")
  const [evaluationType, setEvaluationType] = useState("")
  const [selectedSalesperson, setSelectedSalesperson] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const allQuestions = evaluationQuestions.flatMap((section) =>
    section.questions.map((question) => ({
      category: section.category,
      topic: section.topic,
      question,
    })),
  )

  const resetEvaluationState = () => {
    setEvaluationType("")
    setSelectedSalesperson("")
    setCurrentQuestionIndex(0)
    setAnswers({})
  }

  useEffect(() => {
    // Limpar estado ao carregar a página
    resetEvaluationState()
  }, [])

  const handleTypeSelection = (type: string) => {
    setAnswers({}) // Limpar respostas anteriores
    setEvaluationType(type)
    setStep("instructions")
  }

  const handleStartEvaluation = () => {
    setStep("salesperson")
  }

  const handleSalespersonSelection = (salesperson: string) => {
    setSelectedSalesperson(salesperson)
    setCurrentQuestionIndex(0) // Reset question index
    setAnswers({}) // Limpar respostas anteriores
    setStep("evaluation")
  }

  const handleAnswerChange = (value: string) => {
    const questionKey = `${allQuestions[currentQuestionIndex].category}-${currentQuestionIndex}`
    setAnswers((prev) => ({ ...prev, [questionKey]: value }))
  }

  const getCurrentPeriod = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    return month < 6 ? `${year}-S1` : `${year}-S2`
  }

  const handleNext = async () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      console.log("[v0] === INICIANDO SALVAMENTO REAL ===")

      try {
        const supabase = createClient()
        console.log("[v0] Cliente Supabase criado")

        // 1. Buscar ou criar o gestor de contas
        console.log("[v0] Buscando gestor de contas:", selectedSalesperson)

        let { data: gestor, error: gestorError } = await supabase
          .from("gestores_de_contas")
          .select("*")
          .eq("nome", selectedSalesperson)
          .single()

        if (gestorError && gestorError.code === "PGRST116") {
          // Gestor não existe, criar
          console.log("[v0] Criando novo gestor de contas")
          const { data: novoGestor, error: criarGestorError } = await supabase
            .from("gestores_de_contas")
            .insert({ nome: selectedSalesperson, ativo: true })
            .select()
            .single()

          if (criarGestorError) {
            console.error("[v0] Erro ao criar gestor:", criarGestorError)
            throw criarGestorError
          }
          gestor = novoGestor
        } else if (gestorError) {
          console.error("[v0] Erro ao buscar gestor:", gestorError)
          throw gestorError
        }

        console.log("[v0] Gestor encontrado/criado:", gestor)

        // 2. Buscar ou criar o período
        const periodoNome = getCurrentPeriod()
        console.log("[v0] Buscando período:", periodoNome)

        let { data: periodo, error: periodoError } = await supabase
          .from("periodos_avaliacao")
          .select("*")
          .eq("nome", periodoNome)
          .single()

        if (periodoError && periodoError.code === "PGRST116") {
          // Período não existe, criar
          console.log("[v0] Criando novo período")
          const { data: novoPeriodo, error: criarPeriodoError } = await supabase
            .from("periodos_avaliacao")
            .insert({
              nome: periodoNome,
              ativo: true,
              data_inicio: new Date().toISOString().split("T")[0],
              data_fim: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split("T")[0],
            })
            .select()
            .single()

          if (criarPeriodoError) {
            console.error("[v0] Erro ao criar período:", criarPeriodoError)
            throw criarPeriodoError
          }
          periodo = novoPeriodo
        } else if (periodoError) {
          console.error("[v0] Erro ao buscar período:", periodoError)
          throw periodoError
        }

        console.log("[v0] Período encontrado/criado:", periodo)

        // 3. Criar a avaliação
        console.log("[v0] Criando avaliação")
        const { data: avaliacao, error: avaliacaoError } = await supabase
          .from("avaliacoes")
          .insert({
            gestor_de_contas_id: gestor.id,
            periodo_id: periodo.id,
            tipo_avaliacao: evaluationType === "self" ? "self" : "third-party",
            avaliador_nome: evaluationType === "self" ? selectedSalesperson : "Gestor",
            data_avaliacao: new Date().toISOString(),
            ativo: true,
          })
          .select()
          .single()

        if (avaliacaoError) {
          console.error("[v0] Erro ao criar avaliação:", avaliacaoError)
          throw avaliacaoError
        }

        console.log("[v0] Avaliação criada:", avaliacao)

        console.log("[v0] Buscando categorias e perguntas")
        const { data: categorias, error: categoriasError } = await supabase
          .from("categorias")
          .select("*")
          .order("ordem")
        const { data: perguntas, error: perguntasError } = await supabase.from("perguntas").select("*").order("ordem")

        if (categoriasError || perguntasError) {
          console.error("[v0] Erro ao buscar categorias/perguntas:", categoriasError || perguntasError)
          throw categoriasError || perguntasError
        }

        console.log("[v0] Categorias encontradas:", categorias)
        console.log("[v0] Perguntas encontradas:", perguntas)

        // Mapeamento direto das categorias do frontend para o banco
        const mapeamentoCategorias = {
          "Visão de Negócios": "Visão de Negócios",
          "Conhecimento de Vendas": "Conhecimento de Vendas",
          "Relacionamento Interpessoal": "Relacionamento Interpessoal",
          Autogestão: "Autogestão",
        }

        const respostasParaSalvar = []

        // Agrupar respostas por categoria
        const respostasPorCategoria = {}
        for (const [questionKey, resposta] of Object.entries(answers)) {
          const questionIndex = Number.parseInt(questionKey.split("-").pop() || "0")
          const question = allQuestions[questionIndex]

          if (question && resposta) {
            const categoria = question.category
            if (!respostasPorCategoria[categoria]) {
              respostasPorCategoria[categoria] = []
            }
            respostasPorCategoria[categoria].push(Number.parseInt(resposta))
          }
        }

        console.log("[v0] Respostas agrupadas por categoria:", respostasPorCategoria)

        // Para cada categoria do frontend, encontrar a correspondente no banco
        for (const [categoriaFrontend, valores] of Object.entries(respostasPorCategoria)) {
          const nomeCategoriaBanco = mapeamentoCategorias[categoriaFrontend]

          if (nomeCategoriaBanco && valores.length > 0) {
            // Encontrar categoria no banco pelo nome exato
            const categoriaDb = categorias.find((c) => c.nome === nomeCategoriaBanco)

            if (categoriaDb) {
              // Encontrar primeira pergunta desta categoria
              const perguntaDb = perguntas.find((p) => p.categoria_id === categoriaDb.id)

              if (perguntaDb) {
                const media = valores.reduce((a, b) => a + b, 0) / valores.length

                respostasParaSalvar.push({
                  avaliacao_id: avaliacao.id,
                  categoria_id: categoriaDb.id,
                  pergunta_id: perguntaDb.id,
                  valor: Math.round(media),
                })

                console.log(
                  `[v0] Mapeado ${categoriaFrontend} -> categoria_id: ${categoriaDb.id}, pergunta_id: ${perguntaDb.id}, média: ${Math.round(media)}`,
                )
              } else {
                console.log(`[v0] Nenhuma pergunta encontrada para categoria: ${categoriaDb.nome}`)
              }
            } else {
              console.log(`[v0] Categoria não encontrada no banco: ${nomeCategoriaBanco}`)
            }
          }
        }

        console.log("[v0] Respostas para salvar:", respostasParaSalvar)

        // 6. Inserir respostas
        if (respostasParaSalvar.length > 0) {
          const { data: respostasInseridas, error: respostasError } = await supabase
            .from("respostas")
            .insert(respostasParaSalvar)
            .select()

          if (respostasError) {
            console.error("[v0] Erro ao inserir respostas:", respostasError)
            throw respostasError
          }

          console.log("[v0] Respostas inseridas com sucesso:", respostasInseridas)
        } else {
          console.log("[v0] Nenhuma resposta para salvar - array vazio")
        }

        console.log("[v0] === SALVAMENTO CONCLUÍDO COM SUCESSO ===")
        alert("✅ Avaliação salva com sucesso no Supabase!")
      } catch (error) {
        console.error("[v0] ERRO NO SALVAMENTO:", error)
        alert(`❌ Erro ao salvar no Supabase: ${error.message}`)

        // Fallback para localStorage
        console.log("[v0] Salvando no localStorage como fallback")
      }

      // Salvar também no localStorage (backup)
      const evaluationData = {
        id: `${Date.now()}-${evaluationType}-${selectedSalesperson}`,
        type: evaluationType,
        salesperson: selectedSalesperson,
        answers,
        timestamp: new Date().toISOString(),
        period: getCurrentPeriod(),
        active: true,
      }

      if (typeof window !== "undefined") {
        const existingData = JSON.parse(localStorage.getItem("evaluations") || "[]")
        existingData.push(evaluationData)
        localStorage.setItem("evaluations", JSON.stringify(existingData))
        console.log("[v0] Backup salvo no localStorage")
      }

      setStep("complete")
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100
  const currentQuestionKey = `${allQuestions[currentQuestionIndex]?.category}-${currentQuestionIndex}`
  const currentAnswer = answers[currentQuestionKey]

  if (step === "type") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2D3748] via-[#4A5568] to-[#2D3748] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full animate-pulse delay-700"></div>
        </div>

        {/* Logo in background */}
        <div className="mb-8 z-10">
          <img
            src="https://www.trustcontrol.com.br/wp-content/uploads/2021/09/logo.png"
            alt="TrustControl"
            className="h-20 opacity-90"
          />
        </div>

        <Card className="w-full max-w-lg shadow-2xl border-0 z-20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              Avaliação 360° | Gestores de Contas da Trust Control
            </CardTitle>
            <CardDescription className="text-gray-600">Selecione abaixo o tipo de avaliação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleTypeSelection("self")}
              className="w-full h-16 text-lg bg-[#8BC34A] hover:bg-[#7CB342] text-white"
              variant="default"
            >
              Autoavaliação
            </Button>
            <Button
              onClick={() => handleTypeSelection("third-party")}
              className="w-full h-16 text-lg border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A]/10"
              variant="outline"
            >
              Avaliação pelo Gestor
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2D3748] via-[#4A5568] to-[#2D3748] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mb-4">
              <img
                src="https://www.trustcontrol.com.br/wp-content/uploads/2021/09/logo.png"
                alt="TrustControl"
                className="h-10 mx-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              {evaluationType === "self" ? "Instruções - Autoavaliação" : "Instruções - Avaliação pelo Gestor"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-[#8BC34A]/30 bg-[#8BC34A]/10">
              <Info className="h-4 w-4 text-[#8BC34A]" />
              <AlertDescription className="text-[#2D3748]">
                {evaluationType === "self" ? (
                  <>
                    <strong>Como funciona a autoavaliação:</strong>
                    <br />• Você irá avaliar suas próprias competências em 4 pilares fundamentais
                    <br />• São 12 questões divididas em: Visão de Negócios, Conhecimento de Vendas, Relacionamento
                    Interpessoal e Autogestão
                    <br />• Seja honesto(a) e reflexivo(a) em suas respostas
                    <br />• Suas respostas são confidenciais e serão usadas para seu desenvolvimento profissional
                  </>
                ) : (
                  <>
                    <strong>Como funciona a avaliação pelo gestor:</strong>
                    <br />• Você irá avaliar um dos Gestor de Contas da Trust Control
                    <br />• São 12 questões divididas em 4 pilares fundamentais
                    <br />• Base sua avaliação em observações concretas e comportamentos demonstrados
                    <br />• Suas respostas são confidenciais e contribuem para o desenvolvimento da equipe
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-[#8BC34A]">12</div>
                <div className="text-sm text-gray-600">Questões</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-[#8BC34A]">4</div>
                <div className="text-sm text-gray-600">Pilares</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Pilares de Avaliação:</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span>📊</span>
                  <span>Visão de Negócios</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>🤝🏻</span>
                  <span>Relacionamento Interpessoal</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>📅</span>
                  <span>Conhecimento de Vendas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>🧭</span>
                  <span>Autogestão</span>
                </div>
              </div>
            </div>

            <Button onClick={handleStartEvaluation} className="w-full bg-[#8BC34A] hover:bg-[#7CB342] text-white">
              Iniciar Avaliação
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "salesperson") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2D3748] via-[#4A5568] to-[#2D3748] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mb-4">
              <img
                src="https://www.trustcontrol.com.br/wp-content/uploads/2021/09/logo.png"
                alt="TrustControl"
                className="h-10 mx-auto mb-4"
              />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">
              {evaluationType === "self" ? "Autoavaliação" : "Avaliação pelo Gestor"}
            </CardTitle>
            <CardDescription>Selecione o(a) Gestor(a) de Contas</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleSalespersonSelection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione Gestor de Contas" />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "evaluation") {
    const currentQuestion = allQuestions[currentQuestionIndex]

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <img
              src="https://www.trustcontrol.com.br/wp-content/uploads/2021/09/logo.png"
              alt="TrustControl"
              className="h-8 mx-auto mb-4"
            />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Pergunta {currentQuestionIndex + 1} de {allQuestions.length}
              </span>
              <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center gap-2 text-lg text-[#8BC34A] font-medium mb-2">
                <span>{categoryIcons[currentQuestion.category as keyof typeof categoryIcons]}</span>
                <span>{currentQuestion.category}</span>
              </div>
              <div className="text-sm text-gray-600 font-medium mb-3">Tópico: {currentQuestion.topic}</div>
              <CardTitle className="text-lg leading-relaxed text-gray-800">{currentQuestion.question}</CardTitle>
              <CardDescription>
                Avaliando: <strong className="text-[#8BC34A]">{selectedSalesperson}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={currentAnswer || ""} onValueChange={handleAnswerChange}>
                {ratingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#8BC34A]/5">
                    <RadioGroupItem value={option.value} id={option.value} className="border-[#8BC34A]/50" />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium text-gray-700">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-8">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="border-[#8BC34A]/50 text-[#8BC34A] hover:bg-[#8BC34A]/10 bg-transparent"
                >
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  className="bg-[#8BC34A] hover:bg-[#7CB342] text-white"
                >
                  {currentQuestionIndex === allQuestions.length - 1 ? "Finalizar" : "Próxima"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-2xl border-0">
          <CardHeader>
            <div className="mb-4">
              <img
                src="https://www.trustcontrol.com.br/wp-content/uploads/2021/09/logo.png"
                alt="TrustControl"
                className="h-10 mx-auto mb-4"
              />
            </div>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Avaliação Concluída!</CardTitle>
            <CardDescription>Obrigado por participar da avaliação 360°</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Sua avaliação foi registrada com sucesso. Os dados serão utilizados para desenvolvimento e melhoria
              contínua da equipe do Projeto Smartank.
            </p>
            <Button
              onClick={() => {
                resetEvaluationState()
                setStep("type")
              }}
              className="w-full bg-[#8BC34A] hover:bg-[#7CB342] text-white"
            >
              Realizar Nova Avaliação
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
