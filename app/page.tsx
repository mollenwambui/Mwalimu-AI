"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnalysisResult, LineAnalysis, ExamAnalysisResult } from "@/lib/analyzeContent"
import { FileUploader } from "./components/upload/FileUploader"

interface FormData {
  disability: string
  educationLevel: string
  subject: string
  file: File
  type: string
}

interface DisabilityIdentificationData {
  characteristics: string
}

interface DisabilityIdentificationResult {
  suggestedDisability: string
  explanation: string
  recommendations: string[]
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | ExamAnalysisResult | null>(null)
  const [identificationResult, setIdentificationResult] = useState<DisabilityIdentificationResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>()
  const { register: registerIdentification, handleSubmit: handleIdentificationSubmit, reset: resetIdentification, formState: { errors: identificationErrors } } = useForm<DisabilityIdentificationData>()
  
  const disability = watch("disability")
  const educationLevel = watch("educationLevel")
  const subject = watch("subject")
  const contentType = watch("type")

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
      formData.append("type", data.type)
      
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

  const onIdentifySubmit = async (data: DisabilityIdentificationData) => {
    if (!data.characteristics.trim()) {
      alert("Please enter student characteristics")
      return
    }

    setIsIdentifying(true)
    
    try {
      const response = await fetch("/api/identify-disability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error("Identification failed")
      }
      
      const result = await response.json()
      setIdentificationResult(result)
    } catch (error) {
      console.error("Error identifying disability:", error)
      alert("Identification failed. Please try again.")
    } finally {
      setIsIdentifying(false)
    }
  }

  const handleCloseReport = () => {
    setAnalysisResult(null)
  }

  const handleCloseIdentification = () => {
    setIdentificationResult(null)
    setIsModalOpen(false)
    resetIdentification()
  }

  const openModal = () => {
    setIdentificationResult(null)
    setIsModalOpen(true)
    resetIdentification()
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
          
          {/* Identify Disability Button */}
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Not sure about a student's disability? Enter their characteristics to get AI-powered suggestions.
          </p>
          <div className="pt-4">
            <Button 
              onClick={openModal}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 px-8 rounded-md shadow-md"
            >
              Identify Potential Disability
            </Button>
          </div>
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
              {/* Content Type Selection */}
              <div>
                <Label className="text-gray-700">Content Type</Label>
                <div className="flex space-x-4 mt-2">
                  <div 
                    className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${contentType === 'notes' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => setValue("type", "notes")}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${contentType === 'notes' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'}`}>
                        {contentType === 'notes' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Class Notes</h3>
                        <p className="text-sm text-gray-600 mt-1">Adapt lesson materials and content</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${contentType === 'exam' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => setValue("type", "exam")}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${contentType === 'exam' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'}`}>
                        {contentType === 'exam' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Exams & Assessments</h3>
                        <p className="text-sm text-gray-600 mt-1">Adapt tests and quizzes</p>
                      </div>
                    </div>
                  </div>
                </div>
                {errors.type && <p className="text-red-500 text-sm">Content type is required</p>}
              </div>
              
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
                      <SelectItem value="dyslexia">Dyslexia</SelectItem>
                      <SelectItem value="dysgraphia">Dysgraphia</SelectItem>
                      <SelectItem value="dyscalculia">Dyscalculia</SelectItem>
                      <SelectItem value="adhd">ADHD</SelectItem>
                      <SelectItem value="autism">Autism/Aspergers</SelectItem>
                      <SelectItem value="down-syndrome">Down Syndrome</SelectItem>
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
                disabled={isLoading || !disability || !selectedFile || !contentType} 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 rounded-md shadow-md"
              >
                {isLoading 
                  ? (contentType === 'exam' ? "Adapting Exam..." : "Analyzing Content...") 
                  : (contentType === 'exam' ? "Adapt Exam for Accessibility" : "Analyze for Accessibility")
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="mt-8 shadow-lg border border-gray-200 relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCloseReport}
              className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-gray-200 z-10"
            >
              <span className="text-gray-500 text-xl">×</span>
            </Button>
            
            {'overallScore' in analysisResult ? (
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
            ) : (
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">Exam Adaptation</CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      {analysisResult.summary}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                    <span className="text-lg font-semibold text-gray-700">Changes:</span>
                    <Badge variant="default">
                      {analysisResult.changesMade}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            )}
            
            <CardContent className="pt-8 px-8">
              {'overallScore' in analysisResult ? (
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
              ) : (
                <div className="space-y-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Adapted Exam</h3>
                    <div className="bg-white p-4 rounded border border-gray-200 whitespace-pre-line">
                      {analysisResult.adaptedExam}
                    </div>
                  </div>
                  
                  {analysisResult.suggestedImages && analysisResult.suggestedImages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Visual Aids</h3>
                      <div className="space-y-4">
                        {analysisResult.suggestedImages.map((image, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mr-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{image.description}</h4>
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Alt text:</span> {image.altText}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    {image.placement === 'before' ? 'Before' : 
                                     image.placement === 'after' ? 'After' : 'Beside'}
                                  </span>
                                  {image.questionNumber && (
                                    <span>Question {image.questionNumber}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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
                  {'overallScore' in analysisResult ? "Download Adapted Content" : "Download Adapted Exam"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Disability Identification Modal */}
      {isModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 bg-opacity-3 z-40"
            onClick={handleCloseIdentification}
          />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all pointer-events-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Identify Potential Disability</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCloseIdentification}
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
                  >
                    <span className="text-gray-500 text-xl">×</span>
                  </Button>
                </div>
                
                {!identificationResult ? (
                  <form onSubmit={handleIdentificationSubmit(onIdentifySubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="characteristics" className="text-gray-700">Student Characteristics</Label>
                      <textarea
                        id="characteristics"
                        {...registerIdentification("characteristics", { required: true })}
                        className="w-full min-h-[150px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mt-2"
                        placeholder="Describe the student's behaviors, challenges, strengths, and any other relevant characteristics..."
                      />
                      {identificationErrors.characteristics && <p className="text-red-500 text-sm mt-1">Characteristics are required</p>}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isIdentifying} 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 rounded-md shadow-md"
                    >
                      {isIdentifying ? "Analyzing Characteristics..." : "Identify Potential Disability"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Suggested Disability</h3>
                      <div className="text-2xl font-bold text-purple-700 mb-4">{identificationResult.suggestedDisability}</div>
                      <p className="text-gray-700">{identificationResult.explanation}</p>
                    </div>
                    
                    {identificationResult.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                        <ul className="space-y-2">
                          {identificationResult.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-purple-600 mr-2">•</span>
                              <span className="text-gray-700">{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Important:</strong> This is an AI-powered suggestion and not a medical diagnosis. Please consult with a qualified professional for a formal assessment.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleCloseIdentification}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-2 px-6 rounded-md shadow-md"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      
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