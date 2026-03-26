import React from 'react';

const QuoteBanner = () => {
    return (
        <section className="quote-banner" style={{ 
            background: 'var(--primary-blue)', 
            color: 'white', 
            padding: '100px 0',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Abstract Background Element */}
            <div style={{ 
                position: 'absolute', 
                top: '-50%', 
                left: '-10%', 
                width: '120%', 
                height: '200%', 
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                zIndex: 1
            }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '20px' }}>
                    Our Platform Vision
                </div>
                <h2 style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: 900, 
                    maxWidth: '900px', 
                    margin: '0 auto', 
                    lineHeight: 1.1,
                    letterSpacing: '-1px'
                }}>
                    Building Transparent Communities <br/>
                    Through <span style={{ color: 'var(--accent-blue)' }}>Digital Trust.</span>
                </h2>
                <div style={{ 
                    width: '60px', 
                    height: '4px', 
                    background: 'var(--accent-blue)', 
                    margin: '40px auto 30px', 
                    borderRadius: '2px' 
                }}></div>
                <p style={{ fontSize: '1.2rem', opacity: 0.7, fontWeight: 500, maxWidth: '600px', margin: '0 auto' }}>
                    Standardizing governance for modern societies with secure, immutable, and accessible digital trails.
                </p>
            </div>
        </section>
    );
};

export default QuoteBanner;
