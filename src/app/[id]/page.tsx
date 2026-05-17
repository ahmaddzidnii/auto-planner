interface SprintIdPageProps {
  params: Promise<{
    id: string;
  }>;
}
const SprintIdPage = async ({ params }: SprintIdPageProps) => {
  const { id } = await params;
  return <div>{id}</div>;
};

export default SprintIdPage;
