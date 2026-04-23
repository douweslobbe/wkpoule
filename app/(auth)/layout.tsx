export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center pitch-bg p-4">
      {/* Decorative pixel art corner flags */}
      <div className="w-full max-w-md">
        {/* Logo block */}
        <div className="text-center mb-8">
          <div className="inline-block pixel-card-orange px-6 py-4 mb-4">
            <div className="text-4xl mb-1">⚽</div>
            <h1 className="font-pixel text-white text-xs leading-relaxed tracking-wide">
              DOUWE&apos;S<br/>
              <span className="text-yellow-300">SUPER</span><br/>
              MEGALOMANE<br/>
              WK POOL<br/>
              <span className="text-yellow-300">2026</span>
            </h1>
          </div>
          <p className="text-green-300 text-xs font-pixel mt-3">VOORSPEL · VERSLA · WIN</p>
        </div>
        {children}
      </div>
    </div>
  )
}
