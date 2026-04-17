export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">⚽</div>
          <h1 className="text-3xl font-bold text-white">WK Poule 2026</h1>
          <p className="text-orange-100 mt-1">Voorspel, versla je vrienden, win de roem</p>
        </div>
        {children}
      </div>
    </div>
  )
}
