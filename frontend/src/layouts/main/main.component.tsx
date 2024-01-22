export default function Main({ children }) {
  return (
    <div className="container">
      <main id="content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
