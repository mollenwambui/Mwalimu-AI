// app/reports/page.tsx
"use client"

import { useAuth } from '@/app/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Save, FileDown } from 'lucide-react'

interface Subject {
    name: string
    term1: { achievement: string; effort: string }
    term2: { achievement: string; effort: string }
    term3: { achievement: string; effort: string }
}

interface PersonalDevelopment {
    name: string
    term1: string
    term2: string
    term3: string
}

interface ReportData {
    title: string
    studentInfo: {
        name: string
        studentNumber: string
        class: string
        classTeacher: string
        daysAbsent: number
        daysLate: number
    }
    subjects: Subject[]
    personalDevelopment: PersonalDevelopment[]
    endOfYearReport: {
        school: string
        class: string
        studentName: string
        admissionNo: string
        qidNumber: string
        teacher: string
        date: string
    }
}

export default function ReportsPage() {
    const { user, loading } = useAuth()
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !user) {
            redirect('/login')
        }
    }, [user, loading])

    useEffect(() => {
        // Initialize empty form data
        const initialReportData: ReportData = {
            title: "End of Term 2 Report: June 2025",
            studentInfo: {
                name: '',
                studentNumber: '',
                class: '',
                classTeacher: '',
                daysAbsent: 0,
                daysLate: 0
            },
            subjects: [
                { name: 'English - Reading', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'English - Writing', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'English - SPAG', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Mathematics', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Science', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Information Technology (ICT)', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'History', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Geography', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Kiswahili', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Pre-Technical', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'CRE', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Agriculture and Nutrition', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Physical Education (PE)', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Community Service Learning', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } },
                { name: 'Art and Design & Technology', term1: { achievement: '', effort: '' }, term2: { achievement: '', effort: '' }, term3: { achievement: '', effort: '' } }
            ],
            personalDevelopment: [
                { name: 'Behavior & Attitude', term1: '', term2: '', term3: '' },
                { name: 'Relationships with Peers', term1: '', term2: '', term3: '' },
                { name: 'Works independently', term1: '', term2: '', term3: '' },
                { name: 'Self-Awareness', term1: '', term2: '', term3: '' },
                { name: 'Social Awareness', term1: '', term2: '', term3: '' },
                { name: 'Behaves well in class', term1: '', term2: '', term3: '' },
                { name: 'Presentation of work', term1: '', term2: '', term3: '' },
                { name: 'Homework', term1: '', term2: '', term3: '' }
            ],
            endOfYearReport: {
                school: '',
                class: '',
                studentName: '',
                admissionNo: '',
                qidNumber: '',
                teacher: '',
                date: ''
            }
        }

        setReportData(initialReportData)
    }, [])

    const handleStudentInfoChange = (field: string, value: string | number) => {
        if (!reportData) return
        setReportData({
            ...reportData,
            studentInfo: {
                ...reportData.studentInfo,
                [field]: value
            }
        })
    }

    const handleSubjectChange = (index: number, term: string, field: string, value: string) => {
        if (!reportData) return
        const newSubjects = [...reportData.subjects]
        newSubjects[index] = {
            ...newSubjects[index],
            [term]: {
                ...(newSubjects[index][term as keyof Subject] as Record<string, any>),
                [field]: value
            }
        }
        setReportData({
            ...reportData,
            subjects: newSubjects
        })
    }

    const handlePersonalDevelopmentChange = (index: number, term: string, value: string) => {
        if (!reportData) return
        const newPersonalDevelopment = [...reportData.personalDevelopment]
        newPersonalDevelopment[index] = {
            ...newPersonalDevelopment[index],
            [term]: value
        }
        setReportData({
            ...reportData,
            personalDevelopment: newPersonalDevelopment
        })
    }

    const handleEndOfYearChange = (field: string, value: string) => {
        if (!reportData) return
        setReportData({
            ...reportData,
            endOfYearReport: {
                ...reportData.endOfYearReport,
                [field]: value
            }
        })
    }

    const handleSave = async () => {
        if (!reportData) return

        setIsSaving(true)
        setSaveMessage(null)

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            })

            const data = await response.json()

            if (response.ok) {
                setSaveMessage('Report saved successfully!')
            } else {
                setSaveMessage(`Error: ${data.message}`)
            }
        } catch (error) {
            console.error('Save report error:', error)
            setSaveMessage('Network error. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDownload = () => {
        alert("Download functionality would be implemented here")
    }

    if (loading || !reportData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading report form...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Student Report Form</h1>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outline" onClick={handleDownload}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    </div>

                    {saveMessage && (
                        <div className={`px-6 py-3 ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {saveMessage}
                        </div>
                    )}

                    {/* Report Title */}
                    <div className="px-6 py-4">
                        <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Report Title
                        </label>
                        <input
                            id="reportTitle"
                            type="text"
                            value={reportData.title}
                            onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Student Information */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    id="studentName"
                                    type="text"
                                    value={reportData.studentInfo.name}
                                    onChange={(e) => handleStudentInfoChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Student Number
                                </label>
                                <input
                                    id="studentNumber"
                                    type="text"
                                    value={reportData.studentInfo.studentNumber}
                                    onChange={(e) => handleStudentInfoChange('studentNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                                    Class
                                </label>
                                <input
                                    id="class"
                                    type="text"
                                    value={reportData.studentInfo.class}
                                    onChange={(e) => handleStudentInfoChange('class', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="classTeacher" className="block text-sm font-medium text-gray-700 mb-1">
                                    Class Teacher
                                </label>
                                <input
                                    id="classTeacher"
                                    type="text"
                                    value={reportData.studentInfo.classTeacher}
                                    onChange={(e) => handleStudentInfoChange('classTeacher', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="daysAbsent" className="block text-sm font-medium text-gray-700 mb-1">
                                    Days Absent
                                </label>
                                <input
                                    id="daysAbsent"
                                    type="number"
                                    min="0"
                                    value={reportData.studentInfo.daysAbsent}
                                    onChange={(e) => handleStudentInfoChange('daysAbsent', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="daysLate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Days Late
                                </label>
                                <input
                                    id="daysLate"
                                    type="number"
                                    min="0"
                                    value={reportData.studentInfo.daysLate}
                                    onChange={(e) => handleStudentInfoChange('daysLate', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Achievement and Effort Levels */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement and Effort Levels</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Academic Achievement</h4>
                                <div className="space-y-1">
                                    <div className="flex">
                                        <span className="font-medium w-8">M:</span>
                                        <span>Mastery Level</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">WD:</span>
                                        <span>Well-developed - above the required level</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">P:</span>
                                        <span>Proficient - demonstrating a good understanding of the required level</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">C:</span>
                                        <span>Capable - working at the required level</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">D:</span>
                                        <span>Developing - working towards the required level</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Effort</h4>
                                <div className="space-y-1">
                                    <div className="flex">
                                        <span className="font-medium w-8">1:</span>
                                        <span>Excellent</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">2:</span>
                                        <span>Good</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">3:</span>
                                        <span>Satisfactory</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">4:</span>
                                        <span>Needs Improvement</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium w-8">5:</span>
                                        <span>Cause for Concern</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Term 1</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Term 2</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Term 3</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.subjects.map((subject, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <div className="flex flex-col space-y-1">
                                                    <select
                                                        value={subject.term1.achievement}
                                                        onChange={(e) => handleSubjectChange(index, 'term1', 'achievement', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="M">M</option>
                                                        <option value="WD">WD</option>
                                                        <option value="P">P</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                    <select
                                                        value={subject.term1.effort}
                                                        onChange={(e) => handleSubjectChange(index, 'term1', 'effort', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <div className="flex flex-col space-y-1">
                                                    <select
                                                        value={subject.term2.achievement}
                                                        onChange={(e) => handleSubjectChange(index, 'term2', 'achievement', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="M">M</option>
                                                        <option value="WD">WD</option>
                                                        <option value="P">P</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                    <select
                                                        value={subject.term2.effort}
                                                        onChange={(e) => handleSubjectChange(index, 'term2', 'effort', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <div className="flex flex-col space-y-1">
                                                    <select
                                                        value={subject.term3.achievement}
                                                        onChange={(e) => handleSubjectChange(index, 'term3', 'achievement', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="M">M</option>
                                                        <option value="WD">WD</option>
                                                        <option value="P">P</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                    <select
                                                        value={subject.term3.effort}
                                                        onChange={(e) => handleSubjectChange(index, 'term3', 'effort', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Personal and Social Development */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal and Social Development</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Term 1</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Term 2</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Term 3</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.personalDevelopment.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <select
                                                    value={item.term1}
                                                    onChange={(e) => handlePersonalDevelopmentChange(index, 'term1', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <select
                                                    value={item.term2}
                                                    onChange={(e) => handlePersonalDevelopmentChange(index, 'term2', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <select
                                                    value={item.term3}
                                                    onChange={(e) => handlePersonalDevelopmentChange(index, 'term3', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* End of Year Report */}
                    <div className="px-6 py-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">End of Year Report</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                                    School
                                </label>
                                <input
                                    id="school"
                                    type="text"
                                    value={reportData.endOfYearReport.school}
                                    onChange={(e) => handleEndOfYearChange('school', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="reportClass" className="block text-sm font-medium text-gray-700 mb-1">
                                    Class
                                </label>
                                <input
                                    id="reportClass"
                                    type="text"
                                    value={reportData.endOfYearReport.class}
                                    onChange={(e) => handleEndOfYearChange('class', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Student's Name
                                </label>
                                <input
                                    id="studentName"
                                    type="text"
                                    value={reportData.endOfYearReport.studentName}
                                    onChange={(e) => handleEndOfYearChange('studentName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="admissionNo" className="block text-sm font-medium text-gray-700 mb-1">
                                    Admission No
                                </label>
                                <input
                                    id="admissionNo"
                                    type="text"
                                    value={reportData.endOfYearReport.admissionNo}
                                    onChange={(e) => handleEndOfYearChange('admissionNo', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="qidNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    QID Number
                                </label>
                                <input
                                    id="qidNumber"
                                    type="text"
                                    value={reportData.endOfYearReport.qidNumber}
                                    onChange={(e) => handleEndOfYearChange('qidNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
                                    Teacher
                                </label>
                                <input
                                    id="teacher"
                                    type="text"
                                    value={reportData.endOfYearReport.teacher}
                                    onChange={(e) => handleEndOfYearChange('teacher', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    id="date"
                                    type="text"
                                    value={reportData.endOfYearReport.date}
                                    onChange={(e) => handleEndOfYearChange('date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <div className="flex space-x-4">
                                <div className="text-center">
                                    <div className="h-12 w-32 border-b border-gray-300"></div>
                                    <p className="text-sm text-gray-600 mt-1">Head of Primary's Signature</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-32 border-b border-gray-300"></div>
                                    <p className="text-sm text-gray-600 mt-1">Principal</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-32 border-b border-gray-300"></div>
                                    <p className="text-sm text-gray-600 mt-1">Class Teacher</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}