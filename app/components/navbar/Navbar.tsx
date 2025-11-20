// app/components/navbar/Navbar.tsx
"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, X, LogIn, UserPlus, FileText } from 'lucide-react' // Added FileText icon

export function Navbar() {
  const { user, login, signup, logout, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    
    const success = await login(email, password)
    if (success) {
      setShowAuthModal(false)
      setEmail('')
      setPassword('')
    } else {
      setAuthError('Invalid email or password')
    }
    
    setAuthLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    
    const success = await signup(name, email, password)
    
    if (success) {
      // Show success message and reset form
      setShowSuccessMessage(true)
      setName('')
      setEmail('')
      setPassword('')
      
      // After 2 seconds, switch to login mode
      setTimeout(() => {
        setIsLoginMode(true)
        setShowSuccessMessage(false)
      }, 2000)
    } else {
      setAuthError('Failed to create account')
    }
    
    setAuthLoading(false)
  }

  const openLoginModal = () => {
    setIsLoginMode(true)
    setShowAuthModal(true)
    setAuthError('')
    setShowSuccessMessage(false)
  }

  const openSignupModal = () => {
    setIsLoginMode(false)
    setShowAuthModal(true)
    setAuthError('')
    setShowSuccessMessage(false)
  }

  const switchAuthMode = () => {
    setIsLoginMode(!isLoginMode)
    setAuthError('')
    setShowSuccessMessage(false)
  }

  const closeModal = () => {
    setShowAuthModal(false)
    setAuthError('')
    setShowSuccessMessage(false)
  }

  // Don't render anything while checking auth status
  if (loading) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <div className="text-white text-xl font-bold">M</div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center shadow">
                    <div className="text-white text-xs font-bold">AI</div>
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">Mwalim <span className="text-indigo-600">AI</span></span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <div className="text-white text-xl font-bold">M</div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center shadow">
                    <div className="text-white text-xs font-bold">AI</div>
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">Mwalim <span className="text-indigo-600">AI</span></span>
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/reports">
                    <Button variant="ghost" className="text-gray-700 hover:text-indigo-600">
                      <FileText className="mr-2 h-4 w-4" />
                      Reports
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-indigo-100 text-indigo-800">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none">Hi, {user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    onClick={openLoginModal}
                    className="text-gray-700 hover:text-indigo-600"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in
                  </Button>
                  <Button 
                    onClick={openSignupModal}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {user ? (
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-indigo-100 text-indigo-800">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">Hi, {user.name}</div>
                      <div className="text-sm font-medium text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Link href="/reports" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className="mt-3 w-full justify-start text-gray-700 hover:text-indigo-600"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Reports
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={logout}
                    className="mt-1 w-full justify-start text-gray-700 hover:text-indigo-600"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="px-4 py-2 space-y-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      openLoginModal()
                      setIsMenuOpen(false)
                    }}
                    className="w-full justify-start text-gray-700 hover:text-indigo-600"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in
                  </Button>
                  <Button 
                    onClick={() => {
                      openSignupModal()
                      setIsMenuOpen(false)
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal with Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {isLoginMode ? 'Log in to your account' : 'Create a new account'}
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {showSuccessMessage ? (
                <div className="text-center py-6">
                  <div className="text-green-500 text-5xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h3>
                  <p className="text-gray-600">Your account has been created successfully. You can now log in.</p>
                </div>
              ) : (
                <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="space-y-4">
                  {!isLoginMode && (
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  {authError && (
                    <div className="text-red-500 text-sm">{authError}</div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {authLoading 
                      ? (isLoginMode ? 'Logging in...' : 'Creating account...') 
                      : (isLoginMode ? 'Log in' : 'Sign up')
                    }
                  </Button>
                  
                  <div className="text-center text-sm text-gray-600 mt-2">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                      type="button"
                      onClick={switchAuthMode}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {isLoginMode ? 'Sign up' : 'Log in'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}