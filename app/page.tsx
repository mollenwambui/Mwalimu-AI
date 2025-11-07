"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnalysisResult, LineAnalysis } from "@/lib/analyzeContent"
import { FileUploader } from "./components/upload/FileUploader"

interface FormData {
  disability: string
  educationLevel: string
  subject: string
  file: File
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>()
  
  const disability = watch("disability")
  const educationLevel = watch("educationLevel")
  const subject = watch("subject")

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      alert("Please select a file to upload")
      return
    }

    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("disability", data.disability)
      formData.append("educationLevel", data.educationLevel)
      formData.append("subject", data.subject)
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Upload failed")
      }
      
      const result = await response.json()
      setAnalysisResult(result.analysis)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseReport = () => {
    setAnalysisResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <div className="text-white text-3xl font-bold">M</div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center shadow">
                <div className="text-white text-lg font-bold">AI</div>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Mwalimu <span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-10">
            Upload your teaching materials and get specific, line-by-line adaptations 
            for students with disabilities.
          </p>
        
        </div>
      </div>

      {/* Upload & Analysis Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-2xl text-gray-900">Analyze Your Content</CardTitle>
            <CardDescription className="text-gray-600">
              Upload educational material and get specific adaptations based on disability
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Dropdowns Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Disability Dropdown */}
                <div>
                  <Label htmlFor="disability" className="text-gray-700">Disability</Label>
                  <Select onValueChange={(value) => setValue("disability", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disability" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Learning Disabilities */}
                      <SelectItem value="dyslexia">Dyslexia</SelectItem>
                      <SelectItem value="dysgraphia">Dysgraphia</SelectItem>
                      <SelectItem value="dyscalculia">Dyscalculia</SelectItem>
                      
                      {/* Neurodevelopmental Disorders */}
                      <SelectItem value="adhd">ADHD</SelectItem>
                      <SelectItem value="autism">Autism/Aspergers</SelectItem>
                      <SelectItem value="down-syndrome">Down Syndrome</SelectItem>
                      
                      {/* Other Categories */}
                      <SelectItem value="gifted-talented">Gifted and Talented</SelectItem>
                      <SelectItem value="emotional-behavioral">Emotional/Behavioral Challenges</SelectItem>
                      <SelectItem value="hearing-impairment">Hearing Impairment</SelectItem>
                      <SelectItem value="visual-impairment">Visual Impairment</SelectItem>
                      <SelectItem value="communication-disorder">Communication Disorders</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.disability && <p className="text-red-500 text-sm">Disability is required</p>}
                </div>
                
                {/* Education Level Dropdown */}
                <div>
                  <Label htmlFor="educationLevel" className="text-gray-700">Education Level</Label>
                  <Select onValueChange={(value) => setValue("educationLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary-1-3">Primary Grade 1-3</SelectItem>
                      <SelectItem value="upper-primary-4-6">Upper Primary 4-6</SelectItem>
                      <SelectItem value="junior-school">Junior School</SelectItem>
                      <SelectItem value="senior-secondary">Senior Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.educationLevel && <p className="text-red-500 text-sm">Education level is required</p>}
                </div>
                
                {/* Subject Dropdown */}
                <div>
                  <Label htmlFor="subject" className="text-gray-700">Subject</Label>
                  <Select onValueChange={(value) => setValue("subject", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Primary Grade 1-3 Subjects */}
                      {educationLevel === "primary-1-3" && (
                        <>
                          <SelectItem value="math">Math</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="kiswahili">Kiswahili</SelectItem>
                          <SelectItem value="cre">CRE</SelectItem>
                          <SelectItem value="creative-arts">Creative Arts</SelectItem>
                          <SelectItem value="environmental-studies">Environmental Studies</SelectItem>
                          <SelectItem value="pe">PE</SelectItem>
                        </>
                      )}
                      
                      {/* Upper Primary 4-6 Subjects */}
                      {educationLevel === "upper-primary-4-6" && (
                        <>
                          <SelectItem value="math">Math</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="kiswahili">Kiswahili</SelectItem>
                          <SelectItem value="cre">CRE</SelectItem>
                          <SelectItem value="social-studies">Social Studies</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="home-science">Home Science</SelectItem>
                          <SelectItem value="creative-arts">Creative Arts</SelectItem>
                          <SelectItem value="pe">PE</SelectItem>
                        </>
                      )}
                      
                      {/* Junior School Subjects */}
                      {educationLevel === "junior-school" && (
                        <>
                          <SelectItem value="pre-tech">Pre-Technical courses</SelectItem>
                          <SelectItem value="math">Math</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="kiswahili">Kiswahili</SelectItem>
                          <SelectItem value="cre">CRE</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="creative-art">Creative Art</SelectItem>
                        </>
                      )}
                      
                      {/* Senior Secondary Subjects */}
                      {educationLevel === "senior-secondary" && (
                        <>
                          <SelectItem value="stem">STEM</SelectItem>
                          <SelectItem value="social-sciences">Social Sciences</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.subject && <p className="text-red-500 text-sm">Subject is required</p>}
                </div>
              </div>
              
              {/* File Upload */}
              <div>
                <Label className="text-gray-700">Upload Your File</Label>
                <FileUploader 
                  onFileSelect={(file) => {
                    setSelectedFile(file)
                    setValue("file", file as any)
                  }}
                  selectedFile={selectedFile || undefined}
                />
                {errors.file && <p className="text-red-500 text-sm">File is required</p>}
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading || !disability || !selectedFile} 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 rounded-md shadow-md"
              >
                {isLoading ? "Analyzing Content..." : "Analyze for Accessibility"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="mt-8 shadow-lg border border-gray-200 relative">
            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCloseReport}
              className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-gray-200 z-10"
            >
              <span className="text-gray-500 text-xl">×</span>
            </Button>
            
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl text-gray-900">Accessibility Analysis</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {analysisResult.summary}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                  <span className="text-lg font-semibold text-gray-700">Score:</span>
                  <Badge variant={analysisResult.overallScore >= 80 ? "default" : analysisResult.overallScore >= 60 ? "secondary" : "destructive"}>
                    {analysisResult.overallScore}/100
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8">
              <div className="space-y-8">
                {analysisResult.lines.map((line, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2 bg-white rounded-r-md shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Line {line.lineNumber}</div>
                    <div className="mb-2">
                      <span className="font-medium text-red-600">Instead of:</span>
                      <p className="bg-red-50 p-3 rounded mt-1">{line.originalLine}</p>
                    </div>
                    {line.suggestedChange && (
                      <div>
                        <span className="font-medium text-green-600">Say it this way:</span>
                        <p className="bg-green-50 p-3 rounded mt-1">{line.suggestedChange}</p>
                      </div>
                    )}
                    {line.reason && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Why:</span> {line.reason}
                      </div>
                    )}
                    {line.strategy && (
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Strategy:</span> {line.strategy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {analysisResult.recommendations.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-10 pt-8 border-t border-gray-200 flex justify-center">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-md shadow-md">
                  Download Adapted Content
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Mwalimu AI. All rights reserved.</p>
          <p className="mt-1">Empowering educators to create inclusive learning environments</p>
        </div>
      </footer>
    </div>
  )
}