export default function TextPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '32px',
          fontWeight: '600',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          文字页面
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px',
          lineHeight: '1.6',
          textAlign: 'center',
        }}>
          这是一个新创建的空白页面,你可以在这里添加任何内容。
        </p>
      </div>
    </main>
  )
}
