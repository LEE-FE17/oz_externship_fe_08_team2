export function CommentLoadingDots() {
  return (
    <>
      <style>{`
        @keyframes comment-wave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        .comment-dot {
          animation: comment-wave 1s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center justify-center gap-2 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="comment-dot inline-block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: '#6201E0',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}
