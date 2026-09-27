import { ImageResponse } from 'next/og'

export const alt = 'Med-ADN - The Largest Medical App in Algeria'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    color: 'white',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        textAlign: 'center',
                    }}
                >
                    {/* Logo representation since we can't easily import the image file in Edge runtime without arraybuffer dance */}
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '30px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            marginBottom: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '60px',
                            fontWeight: 'bold',
                            color: 'white',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        M
                    </div>

                    <h1 style={{ fontSize: '80px', fontWeight: 'bold', margin: '0 0 20px 0', lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #94a3b8)', backgroundClip: 'text', color: 'transparent' }}>
                        Med-ADN
                    </h1>
                    <h2 style={{ fontSize: '40px', fontWeight: 'normal', margin: '0 0 60px 0', color: '#cbd5e1' }}>
                        The Largest Medical App in Algeria
                    </h2>
                    <div style={{ display: 'flex', gap: '60px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '56px', fontWeight: 'bold', color: '#60a5fa' }}>150k+</span>
                            <span style={{ fontSize: '28px', color: '#94a3b8' }}>Questions</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '56px', fontWeight: 'bold', color: '#60a5fa' }}>12k+</span>
                            <span style={{ fontSize: '28px', color: '#94a3b8' }}>Resources</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '56px', fontWeight: 'bold', color: '#60a5fa' }}>10+</span>
                            <span style={{ fontSize: '28px', color: '#94a3b8' }}>Universities</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
