"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FormData {
  title: string
  disability: string
  educationLevel: string
  subject: string
  content: string
  file?: FileList
}

export default function FileUpload() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>()
  
  const disability = watch("disability")
  const educationLevel = watch("educationLevel")
  const subject = watch("subject")

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("disability", data.disability)
      formData.append("educationLevel", data.educationLevel)
      formData.append("subject", data.subject)
      formData.append("content", data.content)
      
      if (data.file && data.file.length > 0) {
        formData.append("file", data.file[0])
      }
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Upload failed")
      }
      
      const result = await response.json()
      router.push(`/dashboard/result/${result.id}`)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Educational Material</CardTitle>
          <CardDescription>
            Upload your teaching materials and get specific adaptations for students with disabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Input */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="e.g., Introduction to Fractions"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>
            
            {/* Dropdowns Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Disability Dropdown */}
              <div>
                <Label htmlFor="disability">Disability</Label>
                <Select onValueChange={(value) => setValue("disability", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select disability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dyslexia">Dyslexia</SelectItem>
                    <SelectItem value="adhd">ADHD</SelectItem>
                    <SelectItem value="anxiety">Anxiety</SelectItem>
                    <SelectItem value="autism">Autism</SelectItem>
                    <SelectItem value="visual-impairment">Visual Impairment</SelectItem>
                    <SelectItem value="hearing-impairment">Hearing Impairment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.disability && <p className="text-red-500 text-sm">Disability is required</p>}
              </div>
              
              {/* Education Level Dropdown */}
              <div>
                <Label htmlFor="educationLevel">Education Level</Label>
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
                <Label htmlFor="subject">Subject</Label>
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
            
            {/* Content Textarea */}
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                {...register("content", { required: "Content is required" })}
                placeholder="Paste your educational content here or upload a file below"
                rows={6}
              />
              {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}
            </div>
            
            {/* File Upload */}
            <div>
              <Label htmlFor="file">Or Upload a File</Label>
              <Input
                id="file"
                type="file"
                {...register("file")}
                accept=".pdf,.doc,.docx,.txt"
              />
              <p className="text-sm text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, TXT</p>
            </div>
            
            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Processing..." : "Generate Adapted Content"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}