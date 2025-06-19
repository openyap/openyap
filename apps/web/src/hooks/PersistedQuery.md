# Persisted Query

The `usePersistedQuery` hook automatically syncs data from any source with TanStack Query and persists it to localStorage.

## Options

- `queryKey` - Array of strings that uniquely identify this query. Will be prefixed with "persisted" automatically
- `dataSource` - The reactive data source (e.g., from Convex, fetch, etc.) to sync with TanStack Query
- `enabled` - Whether the query should be enabled. Defaults to true
- `staleTime` - Time in milliseconds that data is considered fresh. Inherits from global config if not provided
- `gcTime` - Time in milliseconds that unused/inactive cache data remains in memory. Should match or exceed the persistence maxAge (24 hours). Set to `Infinity` to disable garbage collection

## Usage Examples

### Basic Chat List

```typescript
export function useChatsList() {
  const { data: session } = authClient.useSession();

  const serverChats = useConvexQuery(
    api.functions.chat.getUserChats,
    session ? { sessionToken: session.session.token } : "skip"
  );

  return usePersistedQuery({
    queryKey: ["chats:listMeta"], // becomes ["persisted", "chats:listMeta"] internally
    dataSource: serverChats,
    enabled: !!session,
  });
}
```

### Messages for a Chat

```typescript
export function useMessages(chatId: string) {
  const serverMessages = useConvexQuery(api.functions.message.list, { chatId });

  return usePersistedQuery({
    queryKey: ["messages", chatId], // becomes ["persisted", "messages", chatId] internally
    dataSource: serverMessages,
    enabled: !!chatId,
  });
}
```

### User Profile

```typescript
export function useUserProfile() {
  const { data: session } = authClient.useSession();

  const serverProfile = useConvexQuery(
    api.functions.user.getProfile,
    session ? { sessionToken: session.session.token } : "skip"
  );

  return usePersistedQuery({
    queryKey: ["user:profile"], // becomes ["persisted", "user:profile"] internally
    dataSource: serverProfile,
    enabled: !!session,
  });
}
```

### External API Data

```typescript
export function useExternalData() {
  const [data, setData] = useState();

  useEffect(() => {
    fetch("/api/external")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return usePersistedQuery({
    queryKey: ["external:data"], // becomes ["persisted", "external:data"] internally
    dataSource: data,
  });
}
```

## How It Works

The hook automatically adds `"persisted"` as the first element of your query key. The router only persists queries that start with `"persisted"`. When your data source changes, it automatically updates the TanStack Query cache and persists the new data.

## Query Key Structure

```
Your input:      ["chats:listMeta"]
Internal key:    ["persisted", "chats:listMeta"]
Gets persisted:  Yes

Regular useQuery: ["some:data"]
Gets persisted:   No
```
