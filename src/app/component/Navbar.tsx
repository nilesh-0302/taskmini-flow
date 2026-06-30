import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "16px", padding: "16px" }}>
      <Link href="/">Home</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/projects">Projects</Link>
      <Link href="/projects/new">New Project</Link>
      <Link href="/tasks">Tasks</Link>
    </nav>
  );
}