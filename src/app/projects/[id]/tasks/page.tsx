export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <h1>Create Task</h1>
      <p>For Project ID: {id}</p>
    </main>
  );
}