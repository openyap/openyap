export const Route = createFileRoute({
  loader: async ({ params }) => {
    console.log(params.chatId);
    return {
      chatId: params.chatId,
    };
  },
  component: Chat,
});

function Chat() {
  const { chatId } = Route.useParams();

  return <div>Chat {chatId}</div>;
}
