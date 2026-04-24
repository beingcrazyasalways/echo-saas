'use client';

export default function RightPanel({ children }) {
  return (
    <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg pt-6 sm:pt-8 space-y-4 sm:space-y-6">
      {children}
    </div>
  );
}
