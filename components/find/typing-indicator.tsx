"use client";

export function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

// Keep the CSS within the main FloatingChat component for now
// as it's scoped with <style jsx global>
