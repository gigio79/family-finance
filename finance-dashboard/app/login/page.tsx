"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function LoginForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(callbackUrl)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || "Algo deu errado")
      }
    } catch {
      setError("Falha na conexão com o servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center">
            <div className="bg-primary p-3 rounded-3xl shadow-lg shadow-primary/20 mb-6">
                <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 mb-2">
                Neo<span className="text-primary">Finance</span>
            </h1>
            <p className="text-slate-500 font-medium tracking-tight">
                Protegendo sua economia familiar.
            </p>
        </div>

        <Card className="rounded-[32px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white p-4">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">Acesso Restrito</CardTitle>
            <CardDescription className="text-slate-400">
              Insira a senha do dashboard para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Sua senha..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                {error && (
                  <p className="text-sm font-semibold text-red-500 text-center animate-shake">
                    {error}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    "Entrar no Painel"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-slate-400 text-xs font-medium">
            &copy; {new Date().getFullYear()} NeoFinance - Criado por Antigravity
        </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
