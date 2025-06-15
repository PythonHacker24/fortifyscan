import React from 'react';

const Star = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="absolute rounded-full bg-white animate-twinkle"
    style={{
      width: '2px',
      height: '2px',
      ...style,
    }}
  />
);

export default function Stars() {
  // Generate random positions for stars
  const stars = Array.from({ length: 50 }, (_, i) => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <Star
          key={index}
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.animationDelay,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
} 