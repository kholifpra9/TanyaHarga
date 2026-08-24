export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-smooth">
      {children}
    </div>
  );
}