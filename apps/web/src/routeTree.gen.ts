/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import type { CreateFileRoute, FileRoutesByPath } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ChatChatIdRouteImport } from './routes/chat/$chatId'

// Create/Update Routes

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ChatChatIdRoute = ChatChatIdRouteImport.update({
  id: '/chat/$chatId',
  path: '/chat/$chatId',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRoute
    }
    '/chat/$chatId': {
      id: '/chat/$chatId'
      path: '/chat/$chatId'
      fullPath: '/chat/$chatId'
      preLoaderRoute: typeof ChatChatIdRouteImport
      parentRoute: typeof rootRoute
    }
  }
}

// Add type-safety to the createFileRoute function across the route tree

declare module './routes/index' {
  const createFileRoute: CreateFileRoute<
    '/',
    FileRoutesByPath['/']['parentRoute'],
    FileRoutesByPath['/']['id'],
    FileRoutesByPath['/']['path'],
    FileRoutesByPath['/']['fullPath']
  >
}
declare module './routes/chat/$chatId' {
  const createFileRoute: CreateFileRoute<
    '/chat/$chatId',
    FileRoutesByPath['/chat/$chatId']['parentRoute'],
    FileRoutesByPath['/chat/$chatId']['id'],
    FileRoutesByPath['/chat/$chatId']['path'],
    FileRoutesByPath['/chat/$chatId']['fullPath']
  >
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/chat/$chatId': typeof ChatChatIdRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/chat/$chatId': typeof ChatChatIdRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/chat/$chatId': typeof ChatChatIdRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/chat/$chatId'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/chat/$chatId'
  id: '__root__' | '/' | '/chat/$chatId'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ChatChatIdRoute: typeof ChatChatIdRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ChatChatIdRoute: ChatChatIdRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/chat/$chatId"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/chat/$chatId": {
      "filePath": "chat/$chatId.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
