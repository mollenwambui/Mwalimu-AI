"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalysisResult {
  summary: string
  lines: Array<{
    lineNumber: number
    originalLine: string
    suggestedChange?: string
    reason: string
    strategy: string
    severity: 'low' | 'medium' | 'high'
  }>
  overallScore: number
  recommendations: string[]
}

export default function ResultPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/uploads/${id}`)
        if (!response.ok) throw new Error("Failed to fetch analysis")
        
        const data = await response.json()
        setAnalysis(data.adaptedContent ? JSON.parse(data.adaptedContent) : null)
      } catch (error) {
        console.error("Error fetching analysis:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [id])

  const handleDownload = () => {
    if (!analysis) return
    
    const element = document.createElement("a")
    const fileContent = `Accessibility Analysis Report\n\n${analysis.summary}\n\nOverall Score: ${analysis.overallScore}/100\n\nRecommendations:\n${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}\n\nDetailed Analysis:\n${analysis.lines.map((line, i) => `Line ${line.lineNumber}:\nOriginal: ${line.originalLine}\nSuggestion: ${line.suggestedChange || 'None'}\nReason: ${line.reason}\nStrategy: ${line.strategy}\n`).join('\n')}`
    
    const file = new Blob([fileContent], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `accessibility-analysis-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
  }

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading analysis...</div>
  if (!analysis) return <div className="flex justify-center items-center h-screen">Analysis not found</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Button onClick={() => router.push("/dashboard")} variant="outline" className="mb-4">
          Back to Dashboard
        </Button>
        
        {/* Score and Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Accessibility Analysis Report</h1>
            <p className="text-gray-600">{analysis.summary}</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-lg font-semibold">Score:</span>
            <Badge variant={analysis.overallScore >= 80 ? "default" : analysis.overallScore >= 60 ? "secondary" : "destructive"} className="text-lg px-3 py-1">
              {analysis.overallScore}/100
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Line-by-Line Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Teaching Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="space-y-4">
          {analysis.lines.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">No accessibility issues found. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            analysis.lines.map((line, index) => (
              <Card key={index} className={`border-l-4 ${
                line.severity === 'high' ? 'border-red-500' : 
                line.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Line {line.lineNumber}</CardTitle>
                      <Badge variant={
                        line.severity === 'high' ? 'destructive' : 
                        line.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {line.severity === 'high' ? 'High Priority' : 
                         line.severity === 'medium' ? 'Medium Priority' : 'Low Priority'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Original Text</h4>
                      <div className="bg-gray-50 p-4 rounded font-mono text-sm">
                        {line.originalLine}
                      </div>
                    </div>
                    
                    {line.suggestedChange && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Suggested Adaptation</h4>
                        <div className="bg-green-50 p-4 rounded text-sm">
                          {line.suggestedChange}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Why This Matters</h4>
                        <div className="bg-yellow-50 p-4 rounded text-sm">
                          {line.reason}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Teaching Strategy</h4>
                        <div className="bg-blue-50 p-4 rounded text-sm">
                          {line.strategy}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Overall Teaching Recommendations</CardTitle>
              <CardDescription>
                Evidence-based strategies to support this student's learning needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 flex justify-center">
        <Button onClick={handleDownload} size="lg">
          Download Full Report
        </Button>
      </div>
    </div>
  )
}