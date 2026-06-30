export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <h1>Project Details</h1>
      <p>Project ID: {id}</p>
    </main>
  );
}