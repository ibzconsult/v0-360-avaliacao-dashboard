"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users, TrendingDown, Download, Trash2, TrendingUp, Minus, Home } from "lucide-react"
import { RadarChart } from "@/components/radar-chart"
import { createClient } from "@/lib/supabase/client"

const salespeople = ["Altevir Ferezin", "Diane Pimentel", "Juliana Viana", "Paula Nogueira", "Renágela Araújo"]

const categories = ["Visão de Negócios", "Conhecimento de Vendas", "Relacionamento Interpessoal", "Autogestão"]

const categoryIcons = {
  "Visão de Negócios": "📊",
  "Conhecimento de Vendas": "📅",
  "Relacionamento Interpessoal": "🤝🏻",
  Autogestão: "🧭",
}

const ratingLabels: Record<string, string> = {
  "1": "Discordo totalmente",
  "2": "Discordo parcialmente",
  "3": "Nem concordo e nem discordo",
  "4": "Concordo parcialmente",
  "5": "Concordo totalmente",
}

interface EvaluationData {
  id: string
  type: string
  salesperson: string
  answers: Record<string, string>
  timestamp: string
  period: string
  active: boolean
}

export default function GestaoTrust2025Page() {
  const [selectedSalesperson, setSelectedSalesperson] = useState("Altevir Ferezin")
  const [selectedPeriod, setSelectedPeriod] = useState("Todos")
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvaluations()
  }, [])

  const loadEvaluations = async () => {
    try {
      console.log("[v0] Carregando avaliações do Supabase...")
      const supabase = createClient()

      const { data: supabaseData, error } = await supabase
        .from("avaliacoes")
        .select(`
          id,
          tipo_avaliacao,
          data_avaliacao,
          ativo,
          gestor_de_contas:gestores_de_contas(nome),
          periodo:periodos_avaliacao(nome),
          respostas(
            valor,
            pergunta:perguntas(
              texto,
              categoria:categorias(nome)
            )
          )
        `)
        .eq("ativo", true)

      if (error) {
        console.error("[v0] Erro ao carregar do Supabase:", error)
        // Fallback to localStorage if Supabase fails
        const localData = JSON.parse(localStorage.getItem("evaluations") || "[]")
        console.log("[v0] Carregado do localStorage:", localData.length, "avaliações")
        setEvaluations(localData)
      } else if (supabaseData && supabaseData.length > 0) {
        // Convert Supabase data to expected format
        console.log("[v0] Dados encontrados no Supabase:", supabaseData.length, "registros")
        const convertedData = convertSupabaseToLocal(supabaseData)
        console.log("[v0] Avaliações convertidas:", convertedData.length)
        setEvaluations(convertedData)
      } else {
        // If no data in Supabase, try localStorage
        console.log("[v0] Nenhum dado no Supabase, tentando localStorage...")
        const localData = JSON.parse(localStorage.getItem("evaluations") || "[]")
        console.log("[v0] Carregado do localStorage:", localData.length, "avaliações")
        setEvaluations(localData)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar avaliações:", error)
      // Final fallback to localStorage
      try {
        const localData = JSON.parse(localStorage.getItem("evaluations") || "[]")
        setEvaluations(localData)
      } catch (localError) {
        console.error("[v0] Erro ao carregar do localStorage:", localError)
        setEvaluations([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const convertSupabaseToLocal = (supabaseData: any[]): EvaluationData[] => {
    return supabaseData.map((avaliacao) => ({
      id: avaliacao.id,
      type: avaliacao.tipo_avaliacao,
      salesperson: avaliacao.gestor_de_contas?.nome || "Desconhecido",
      answers: avaliacao.respostas.reduce((acc: Record<string, string>, resposta: any) => {
        const categoria = resposta.pergunta?.categoria?.nome || "Categoria"
        const pergunta = resposta.pergunta?.texto || "Pergunta"
        const key = `${categoria}-${pergunta}`
        acc[key] = resposta.valor.toString()
        return acc
      }, {}),
      timestamp: avaliacao.data_avaliacao,
      period: avaliacao.periodo?.nome || "2025-S2",
      active: avaliacao.ativo,
    }))
  }

  const deleteEvaluation = async (id: string) => {
    try {
      const supabase = createClient()

      // Try to delete from Supabase first
      const { error } = await supabase.from("avaliacoes").update({ ativo: false }).eq("id", id)

      if (error) {
        console.error("Erro ao deletar no Supabase:", error)
      }

      // Update local state regardless
      const updatedEvaluations = evaluations.map((evaluation) =>
        evaluation.id === id ? { ...evaluation, active: false } : evaluation,
      )
      setEvaluations(updatedEvaluations)

      // Also update localStorage as backup
      if (typeof window !== "undefined") {
        localStorage.setItem("evaluations", JSON.stringify(updatedEvaluations))
      }
    } catch (error) {
      console.error("Erro ao deletar avaliação:", error)
    }
  }

  const getActiveEvaluations = () => {
    return evaluations.filter((evaluation) => evaluation.active !== false)
  }

  const getAvailablePeriods = () => {
    const activeEvals = getActiveEvaluations()
    const periods = [...new Set(activeEvals.map((evaluation) => evaluation.period))].sort().reverse()
    return periods
  }

  const getEvaluationsForSalesperson = (salesperson: string, period?: string) => {
    const activeEvals = getActiveEvaluations()
    let filtered = activeEvals.filter((evaluation) => evaluation.salesperson === salesperson)

    if (period && period !== "Todos") {
      filtered = filtered.filter((evaluation) => evaluation.period === period)
    }

    return filtered
  }

  const calculateCategoryAverage = (evaluations: EvaluationData[], category: string) => {
    const categoryAnswers = evaluations.flatMap((evaluation) =>
      Object.entries(evaluation.answers)
        .filter(([key]) => key.startsWith(category))
        .map(([, value]) => Number.parseInt(value)),
    )

    if (categoryAnswers.length === 0) return 0
    return categoryAnswers.reduce((sum, val) => sum + val, 0) / categoryAnswers.length
  }

  const getCompetencyData = (salesperson: string, period?: string) => {
    const salespersonEvals = getEvaluationsForSalesperson(salesperson, period)
    const selfEvals = salespersonEvals.filter((evaluation) => evaluation.type === "self")
    const thirdPartyEvals = salespersonEvals.filter((evaluation) => evaluation.type === "third-party")

    return categories.map((category) => ({
      category,
      autoavaliacao: calculateCategoryAverage(selfEvals, category),
      terceiros: calculateCategoryAverage(thirdPartyEvals, category),
      consolidado: calculateCategoryAverage(salespersonEvals, category),
    }))
  }

  const getRadarChartData = (salesperson: string, period?: string) => {
    const competencyData = getCompetencyData(salesperson, period)

    return competencyData.map((item) => ({
      category: item.category,
      value1: item.autoavaliacao,
      value2: item.terceiros,
      label1: "Autoavaliação",
      label2: "Gestores",
    }))
  }

  const getConsolidatedRadarData = (salesperson: string, period?: string) => {
    const competencyData = getCompetencyData(salesperson, period)

    return competencyData.map((item) => ({
      category: item.category,
      value1: item.consolidado,
      label1: "Consolidado",
    }))
  }

  const getEvolutionData = (salesperson: string) => {
    const periods = getAvailablePeriods()
    if (periods.length < 2) return null

    const lastPeriod = periods[0]
    const previousPeriod = periods[1]

    const lastData = getCompetencyData(salesperson, lastPeriod)
    const previousData = getCompetencyData(salesperson, previousPeriod)

    return categories.map((category) => {
      const lastScore = lastData.find((d) => d.category === category)?.consolidado || 0
      const previousScore = previousData.find((d) => d.category === category)?.consolidado || 0
      const difference = lastScore - previousScore

      return {
        category,
        lastScore,
        previousScore,
        difference,
        trend: difference > 0.1 ? "up" : difference < -0.1 ? "down" : "stable",
      }
    })
  }

  const getEvolutionRadarData = (salesperson: string) => {
    const periods = getAvailablePeriods()
    if (periods.length < 2) return null

    const lastPeriod = periods[0]
    const previousPeriod = periods[1]

    const lastData = getCompetencyData(salesperson, lastPeriod)
    const previousData = getCompetencyData(salesperson, previousPeriod)

    return categories.map((category) => ({
      category,
      value1: previousData.find((d) => d.category === category)?.consolidado || 0,
      value2: lastData.find((d) => d.category === category)?.consolidado || 0,
      label1: `Anterior (${previousPeriod})`,
      label2: `Atual (${lastPeriod})`,
    }))
  }

  const getImprovementPoints = (salesperson: string, period?: string) => {
    const competencyData = getCompetencyData(salesperson, period)
    return competencyData
      .filter((item) => item.consolidado <= 3)
      .sort((a, b) => a.consolidado - b.consolidado)
      .map((item) => ({
        category: item.category,
        score: item.consolidado,
        level: item.consolidado <= 2 ? "Crítico" : "Atenção",
      }))
  }

  const getLastEvaluationDates = (salesperson: string, period?: string) => {
    const salespersonEvals = getEvaluationsForSalesperson(salesperson, period)
    const selfEvals = salespersonEvals.filter((evaluation) => evaluation.type === "self")
    const thirdPartyEvals = salespersonEvals.filter((evaluation) => evaluation.type === "third-party")

    const lastSelf =
      selfEvals.length > 0 ? new Date(Math.max(...selfEvals.map((e) => new Date(e.timestamp).getTime()))) : null

    const lastThirdParty =
      thirdPartyEvals.length > 0
        ? new Date(Math.max(...thirdPartyEvals.map((e) => new Date(e.timestamp).getTime())))
        : null

    return { lastSelf, lastThirdParty, thirdPartyCount: thirdPartyEvals.length }
  }

  const downloadCSV = () => {
    try {
      const activeEvals = getActiveEvaluations()
      const csvContent = [
        ["ID", "Período", "Tipo", "Gestor de Contas", "Data", "Pilar", "Pergunta", "Resposta"].join(","),
        ...activeEvals.flatMap((evaluation) =>
          Object.entries(evaluation.answers).map(([key, value]) => {
            const [category] = key.split("-")
            return [
              evaluation.id,
              evaluation.period,
              evaluation.type === "self" ? "Autoavaliação" : "Gestor",
              evaluation.salesperson,
              new Date(evaluation.timestamp).toLocaleDateString("pt-BR"),
              category,
              "Pergunta",
              ratingLabels[value] || value,
            ].join(",")
          }),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `avaliacoes_360_trustcontrol_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao baixar CSV:", error)
      alert("Erro ao baixar arquivo CSV")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8BC34A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const periods = getAvailablePeriods()
  const competencyData = getCompetencyData(selectedSalesperson, selectedPeriod)
  const improvementPoints = getImprovementPoints(selectedSalesperson, selectedPeriod)
  const { lastSelf, lastThirdParty, thirdPartyCount } = getLastEvaluationDates(selectedSalesperson, selectedPeriod)
  const evolutionData = getEvolutionData(selectedSalesperson)
  const evolutionRadarData = getEvolutionRadarData(selectedSalesperson)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img
              src="https://www.trustcontrol.com.br/wp-content/uploads/2021/09/logo.png"
              alt="TrustControl"
              className="h-8"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão Trust 2025 - {selectedSalesperson}</h1>
              <p className="text-gray-600">Dashboard de Avaliação 360° {selectedPeriod && `- ${selectedPeriod}`}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {periods.length > 0 && (
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A]/5 bg-transparent"
            >
              <Home className="h-4 w-4 mr-2" />
              Início
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#8BC34A] data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="evolution" className="data-[state=active]:bg-[#8BC34A] data-[state=active]:text-white">
              Evolução
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-[#8BC34A] data-[state=active]:text-white">
              Dados
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#8BC34A] data-[state=active]:text-white">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-[#8BC34A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-[#8BC34A]" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avaliações de Gestores</p>
                      <p className="text-2xl font-bold text-gray-900">{thirdPartyCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#8BC34A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Última Autoavaliação</p>
                      <p className="text-sm font-bold text-gray-900">
                        {lastSelf ? lastSelf.toLocaleDateString("pt-BR") : "Não realizada"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#8BC34A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Última Avaliação Gestor</p>
                      <p className="text-sm font-bold text-gray-900">
                        {lastThirdParty ? lastThirdParty.toLocaleDateString("pt-BR") : "Não realizada"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#8BC34A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pontos de Melhoria</p>
                      <p className="text-2xl font-bold text-gray-900">{improvementPoints.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Radar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-[#8BC34A]/20">
                <CardHeader>
                  <CardTitle className="text-[#8BC34A]">Mapa de Competências - Comparativo</CardTitle>
                  <CardDescription>Autoavaliação vs Avaliação de Gestores</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <RadarChart data={getRadarChartData(selectedSalesperson, selectedPeriod)} />
                </CardContent>
              </Card>

              <Card className="border-[#8BC34A]/20">
                <CardHeader>
                  <CardTitle className="text-[#8BC34A]">Consolidado Geral</CardTitle>
                  <CardDescription>Visão integrada de todas as avaliações</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <RadarChart data={getConsolidatedRadarData(selectedSalesperson, selectedPeriod)} />
                </CardContent>
              </Card>
            </div>

            {/* Pillar Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competencyData.map((pillar, index) => (
                <Card key={index} className="border-[#8BC34A]/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#8BC34A]">
                      <span>{categoryIcons[pillar.category as keyof typeof categoryIcons]}</span>
                      <span>{pillar.category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Autoavaliação</span>
                        <Badge variant="outline" className="border-[#8BC34A]/50 text-[#8BC34A]">
                          {pillar.autoavaliacao.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gestores</span>
                        <Badge variant="secondary">{pillar.terceiros.toFixed(1)}</Badge>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Consolidado</span>
                        <Badge
                          variant={
                            pillar.consolidado >= 4 ? "default" : pillar.consolidado >= 3 ? "secondary" : "destructive"
                          }
                          className={
                            pillar.consolidado >= 4 ? "bg-[#8BC34A] text-white" : pillar.consolidado >= 3 ? "" : ""
                          }
                        >
                          {pillar.consolidado.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Improvement Points */}
            {improvementPoints.length > 0 && (
              <Card className="border-[#8BC34A]/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#8BC34A]">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                    Pontos de Melhoria Prioritários
                  </CardTitle>
                  <CardDescription>Pilares que necessitam atenção especial</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {improvementPoints.map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[#8BC34A]/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{categoryIcons[point.category as keyof typeof categoryIcons]}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{point.category}</h4>
                            <p className="text-sm text-gray-600">Pontuação média: {point.score.toFixed(1)}/5.0</p>
                          </div>
                        </div>
                        <Badge variant={point.level === "Crítico" ? "destructive" : "secondary"}>{point.level}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="space-y-8">
            {evolutionRadarData ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-[#8BC34A]/20">
                    <CardHeader>
                      <CardTitle className="text-[#8BC34A]">Evolução dos Pilares</CardTitle>
                      <CardDescription>Comparativo entre penúltima e última avaliação</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <RadarChart data={evolutionRadarData} />
                    </CardContent>
                  </Card>

                  <Card className="border-[#8BC34A]/20">
                    <CardHeader>
                      <CardTitle className="text-[#8BC34A]">Análise de Evolução</CardTitle>
                      <CardDescription>Detalhamento das mudanças por pilar</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {evolutionData?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span>{categoryIcons[item.category as keyof typeof categoryIcons]}</span>
                              <div>
                                <h4 className="font-medium text-gray-900">{item.category}</h4>
                                <p className="text-sm text-gray-600">
                                  {item.previousScore.toFixed(1)} → {item.lastScore.toFixed(1)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.trend === "up" && (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    +{item.difference.toFixed(1)}
                                  </Badge>
                                </>
                              )}
                              {item.trend === "down" && (
                                <>
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                  <Badge variant="destructive">{item.difference.toFixed(1)}</Badge>
                                </>
                              )}
                              {item.trend === "stable" && (
                                <>
                                  <Minus className="h-4 w-4 text-gray-600" />
                                  <Badge variant="secondary">Estável</Badge>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="border-[#8BC34A]/20">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">
                    É necessário ter pelo menos 2 períodos de avaliação para visualizar a evolução.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="data">
            <Card className="border-[#8BC34A]/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-[#8BC34A]">Dados das Avaliações</CardTitle>
                    <CardDescription>Visualize e gerencie todas as avaliações realizadas</CardDescription>
                  </div>
                  <Button onClick={downloadCSV} className="bg-[#8BC34A] hover:bg-[#7CB342] text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Gestor de Contas</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>{evaluation.period}</TableCell>
                        <TableCell>
                          <Badge
                            variant={evaluation.type === "self" ? "default" : "secondary"}
                            className={evaluation.type === "self" ? "bg-[#8BC34A] text-white" : ""}
                          >
                            {evaluation.type === "self" ? "Autoavaliação" : "Gestor"}
                          </Badge>
                        </TableCell>
                        <TableCell>{evaluation.salesperson}</TableCell>
                        <TableCell>{new Date(evaluation.timestamp).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant={evaluation.active !== false ? "default" : "destructive"}>
                            {evaluation.active !== false ? "Ativa" : "Excluída"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {evaluation.active !== false && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
                                  deleteEvaluation(evaluation.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-6">
              {periods.map((period) => (
                <Card key={period} className="border-[#8BC34A]/20">
                  <CardHeader>
                    <CardTitle className="text-[#8BC34A]">Período: {period}</CardTitle>
                    <CardDescription>Avaliações realizadas no período {period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {salespeople.map((person) => {
                        const personEvals = getEvaluationsForSalesperson(person, period)
                        const selfCount = personEvals.filter((e) => e.type === "self").length
                        const thirdPartyCount = personEvals.filter((e) => e.type === "third-party").length

                        return (
                          <div key={person} className="p-4 border border-[#8BC34A]/30 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">{person}</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Autoavaliações: {selfCount}</div>
                              <div>Gestores: {thirdPartyCount}</div>
                              <div className="font-medium">Total: {personEvals.length}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
