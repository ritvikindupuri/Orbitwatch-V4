"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsModalProps {
  className?: string
}

interface SpaceTrackCredentials {
  username: string
  password: string
}

export function SettingsModal({ className }: SettingsModalProps) {
  const [credentials, setCredentials] = useState<SpaceTrackCredentials>({
    username: "",
    password: ""
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  // Load credentials from localStorage on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("spacetrack-credentials")
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials)
        setCredentials(parsed)
      } catch (error) {
        console.error("Failed to parse saved credentials:", error)
      }
    }
  }, [])

  const handleSave = () => {
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setValidationMessage("Please enter both username and password");
      return;
    }

    setIsValidating(true);
    setValidationMessage("Validating credentials and activating real-time data...");
    
    // Save credentials to localStorage
    localStorage.setItem("spacetrack-credentials", JSON.stringify(credentials))
    
    // Send credentials to backend immediately for real-time data
    const socket = (window as any).mlSocket;
    if (socket && socket.connected) {
      // Listen for validation response
      socket.once('credentials_updated', (response: any) => {
        setIsValidating(false);
        if (response.success) {
          setValidationMessage("✅ Real-time Space-Track data activated!");
          setTimeout(() => {
            setIsOpen(false);
            setValidationMessage("");
          }, 2000);
        } else {
          setValidationMessage(`❌ ${response.error}`);
        }
      });
      
      socket.emit('update_credentials', credentials);
      console.log('Credentials sent to backend for real-time data integration');
    } else {
      setIsValidating(false);
      setValidationMessage("❌ Backend not connected. Credentials saved for next connection.");
      setTimeout(() => {
        setIsOpen(false);
        setValidationMessage("");
      }, 2000);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Space Track Settings</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your Space-Track.org credentials to access satellite data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right text-slate-300">
              Username
            </Label>
            <Input
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right text-slate-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        {validationMessage && (
          <div className="px-4 py-2 text-sm text-center">
            {validationMessage.includes("✅") ? (
              <span className="text-green-400">{validationMessage}</span>
            ) : validationMessage.includes("❌") ? (
              <span className="text-red-400">{validationMessage}</span>
            ) : (
              <span className="text-blue-400">{validationMessage}</span>
            )}
          </div>
        )}
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={isValidating}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isValidating ? "Validating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}