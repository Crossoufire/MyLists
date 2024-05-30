/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as UniversalImport } from './routes/_universal'
import { Route as PublicImport } from './routes/_public'
import { Route as PrivateImport } from './routes/_private'
import { Route as PublicIndexImport } from './routes/_public/index'
import { Route as UniversalPrivacypolicyImport } from './routes/_universal/privacy_policy'
import { Route as UniversalAboutImport } from './routes/_universal/about'
import { Route as PublicResetpasswordImport } from './routes/_public/reset_password'
import { Route as PublicRegistertokenImport } from './routes/_public/register_token'
import { Route as PublicForgotpasswordImport } from './routes/_public/forgot_password'
import { Route as PrivateTrendsImport } from './routes/_private/trends'
import { Route as PrivateSettingsImport } from './routes/_private/settings'
import { Route as PrivateHalloffameImport } from './routes/_private/hall_of_fame'
import { Route as PrivateGlobalstatsImport } from './routes/_private/global_stats'
import { Route as PrivateComingnextImport } from './routes/_private/coming_next'
import { Route as PrivateAdminIndexImport } from './routes/_private/admin/index'
import { Route as UniversalLevelsProfilelevelsImport } from './routes/_universal/levels.profile_levels'
import { Route as UniversalLevelsMedialevelsImport } from './routes/_universal/levels.media_levels'
import { Route as PrivateAdminDashboardImport } from './routes/_private/admin/dashboard'
import { Route as PublicOauth2ProviderCallbackImport } from './routes/_public/oauth2.$provider.callback'
import { Route as PrivateStatsMediaTypeUsernameImport } from './routes/_private/stats/$mediaType.$username'
import { Route as PrivateProfileUsernameHeaderImport } from './routes/_private/profile/$username/_header'
import { Route as PrivateListMediaTypeUsernameImport } from './routes/_private/list/$mediaType.$username'
import { Route as PrivateDetailsMediaTypeMediaIdImport } from './routes/_private/details/$mediaType.$mediaId'
import { Route as PrivateProfileUsernameHeaderIndexImport } from './routes/_private/profile/$username/_header/index'
import { Route as PrivateProfileUsernameHeaderHistoryImport } from './routes/_private/profile/$username/_header/history'
import { Route as PrivateProfileUsernameHeaderFollowsImport } from './routes/_private/profile/$username/_header/follows'
import { Route as PrivateProfileUsernameHeaderFollowersImport } from './routes/_private/profile/$username/_header/followers'
import { Route as PrivateDetailsFormMediaTypeMediaIdImport } from './routes/_private/details/form.$mediaType.$mediaId'
import { Route as PrivateDetailsMediaTypeJobInfoImport } from './routes/_private/details/$mediaType.$job.$info'

// Create Virtual Routes

const PrivateProfileUsernameImport = createFileRoute(
  '/_private/profile/$username',
)()

// Create/Update Routes

const UniversalRoute = UniversalImport.update({
  id: '/_universal',
  getParentRoute: () => rootRoute,
} as any)

const PublicRoute = PublicImport.update({
  id: '/_public',
  getParentRoute: () => rootRoute,
} as any)

const PrivateRoute = PrivateImport.update({
  id: '/_private',
  getParentRoute: () => rootRoute,
} as any)

const PublicIndexRoute = PublicIndexImport.update({
  path: '/',
  getParentRoute: () => PublicRoute,
} as any)

const UniversalPrivacypolicyRoute = UniversalPrivacypolicyImport.update({
  path: '/privacy_policy',
  getParentRoute: () => UniversalRoute,
} as any)

const UniversalAboutRoute = UniversalAboutImport.update({
  path: '/about',
  getParentRoute: () => UniversalRoute,
} as any)

const PublicResetpasswordRoute = PublicResetpasswordImport.update({
  path: '/reset_password',
  getParentRoute: () => PublicRoute,
} as any)

const PublicRegistertokenRoute = PublicRegistertokenImport.update({
  path: '/register_token',
  getParentRoute: () => PublicRoute,
} as any)

const PublicForgotpasswordRoute = PublicForgotpasswordImport.update({
  path: '/forgot_password',
  getParentRoute: () => PublicRoute,
} as any)

const PrivateTrendsRoute = PrivateTrendsImport.update({
  path: '/trends',
  getParentRoute: () => PrivateRoute,
} as any)

const PrivateSettingsRoute = PrivateSettingsImport.update({
  path: '/settings',
  getParentRoute: () => PrivateRoute,
} as any)

const PrivateHalloffameRoute = PrivateHalloffameImport.update({
  path: '/hall_of_fame',
  getParentRoute: () => PrivateRoute,
} as any)

const PrivateGlobalstatsRoute = PrivateGlobalstatsImport.update({
  path: '/global_stats',
  getParentRoute: () => PrivateRoute,
} as any)

const PrivateComingnextRoute = PrivateComingnextImport.update({
  path: '/coming_next',
  getParentRoute: () => PrivateRoute,
} as any)

const PrivateProfileUsernameRoute = PrivateProfileUsernameImport.update({
  path: '/profile/$username',
  getParentRoute: () => PrivateRoute,
} as any)

const PrivateAdminIndexRoute = PrivateAdminIndexImport.update({
  path: '/admin/',
  getParentRoute: () => PrivateRoute,
} as any)

const UniversalLevelsProfilelevelsRoute =
  UniversalLevelsProfilelevelsImport.update({
    path: '/levels/profile_levels',
    getParentRoute: () => UniversalRoute,
  } as any)

const UniversalLevelsMedialevelsRoute = UniversalLevelsMedialevelsImport.update(
  {
    path: '/levels/media_levels',
    getParentRoute: () => UniversalRoute,
  } as any,
)

const PrivateAdminDashboardRoute = PrivateAdminDashboardImport.update({
  path: '/admin/dashboard',
  getParentRoute: () => PrivateRoute,
} as any)

const PublicOauth2ProviderCallbackRoute =
  PublicOauth2ProviderCallbackImport.update({
    path: '/oauth2/$provider/callback',
    getParentRoute: () => PublicRoute,
  } as any)

const PrivateStatsMediaTypeUsernameRoute =
  PrivateStatsMediaTypeUsernameImport.update({
    path: '/stats/$mediaType/$username',
    getParentRoute: () => PrivateRoute,
  } as any)

const PrivateProfileUsernameHeaderRoute =
  PrivateProfileUsernameHeaderImport.update({
    id: '/_header',
    getParentRoute: () => PrivateProfileUsernameRoute,
  } as any)

const PrivateListMediaTypeUsernameRoute =
  PrivateListMediaTypeUsernameImport.update({
    path: '/list/$mediaType/$username',
    getParentRoute: () => PrivateRoute,
  } as any)

const PrivateDetailsMediaTypeMediaIdRoute =
  PrivateDetailsMediaTypeMediaIdImport.update({
    path: '/details/$mediaType/$mediaId',
    getParentRoute: () => PrivateRoute,
  } as any)

const PrivateProfileUsernameHeaderIndexRoute =
  PrivateProfileUsernameHeaderIndexImport.update({
    path: '/',
    getParentRoute: () => PrivateProfileUsernameHeaderRoute,
  } as any)

const PrivateProfileUsernameHeaderHistoryRoute =
  PrivateProfileUsernameHeaderHistoryImport.update({
    path: '/history',
    getParentRoute: () => PrivateProfileUsernameHeaderRoute,
  } as any)

const PrivateProfileUsernameHeaderFollowsRoute =
  PrivateProfileUsernameHeaderFollowsImport.update({
    path: '/follows',
    getParentRoute: () => PrivateProfileUsernameHeaderRoute,
  } as any)

const PrivateProfileUsernameHeaderFollowersRoute =
  PrivateProfileUsernameHeaderFollowersImport.update({
    path: '/followers',
    getParentRoute: () => PrivateProfileUsernameHeaderRoute,
  } as any)

const PrivateDetailsFormMediaTypeMediaIdRoute =
  PrivateDetailsFormMediaTypeMediaIdImport.update({
    path: '/details/form/$mediaType/$mediaId',
    getParentRoute: () => PrivateRoute,
  } as any)

const PrivateDetailsMediaTypeJobInfoRoute =
  PrivateDetailsMediaTypeJobInfoImport.update({
    path: '/details/$mediaType/$job/$info',
    getParentRoute: () => PrivateRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_private': {
      id: '/_private'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof PrivateImport
      parentRoute: typeof rootRoute
    }
    '/_public': {
      id: '/_public'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof PublicImport
      parentRoute: typeof rootRoute
    }
    '/_universal': {
      id: '/_universal'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof UniversalImport
      parentRoute: typeof rootRoute
    }
    '/_private/coming_next': {
      id: '/_private/coming_next'
      path: '/coming_next'
      fullPath: '/coming_next'
      preLoaderRoute: typeof PrivateComingnextImport
      parentRoute: typeof PrivateImport
    }
    '/_private/global_stats': {
      id: '/_private/global_stats'
      path: '/global_stats'
      fullPath: '/global_stats'
      preLoaderRoute: typeof PrivateGlobalstatsImport
      parentRoute: typeof PrivateImport
    }
    '/_private/hall_of_fame': {
      id: '/_private/hall_of_fame'
      path: '/hall_of_fame'
      fullPath: '/hall_of_fame'
      preLoaderRoute: typeof PrivateHalloffameImport
      parentRoute: typeof PrivateImport
    }
    '/_private/settings': {
      id: '/_private/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof PrivateSettingsImport
      parentRoute: typeof PrivateImport
    }
    '/_private/trends': {
      id: '/_private/trends'
      path: '/trends'
      fullPath: '/trends'
      preLoaderRoute: typeof PrivateTrendsImport
      parentRoute: typeof PrivateImport
    }
    '/_public/forgot_password': {
      id: '/_public/forgot_password'
      path: '/forgot_password'
      fullPath: '/forgot_password'
      preLoaderRoute: typeof PublicForgotpasswordImport
      parentRoute: typeof PublicImport
    }
    '/_public/register_token': {
      id: '/_public/register_token'
      path: '/register_token'
      fullPath: '/register_token'
      preLoaderRoute: typeof PublicRegistertokenImport
      parentRoute: typeof PublicImport
    }
    '/_public/reset_password': {
      id: '/_public/reset_password'
      path: '/reset_password'
      fullPath: '/reset_password'
      preLoaderRoute: typeof PublicResetpasswordImport
      parentRoute: typeof PublicImport
    }
    '/_universal/about': {
      id: '/_universal/about'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof UniversalAboutImport
      parentRoute: typeof UniversalImport
    }
    '/_universal/privacy_policy': {
      id: '/_universal/privacy_policy'
      path: '/privacy_policy'
      fullPath: '/privacy_policy'
      preLoaderRoute: typeof UniversalPrivacypolicyImport
      parentRoute: typeof UniversalImport
    }
    '/_public/': {
      id: '/_public/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof PublicIndexImport
      parentRoute: typeof PublicImport
    }
    '/_private/admin/dashboard': {
      id: '/_private/admin/dashboard'
      path: '/admin/dashboard'
      fullPath: '/admin/dashboard'
      preLoaderRoute: typeof PrivateAdminDashboardImport
      parentRoute: typeof PrivateImport
    }
    '/_universal/levels/media_levels': {
      id: '/_universal/levels/media_levels'
      path: '/levels/media_levels'
      fullPath: '/levels/media_levels'
      preLoaderRoute: typeof UniversalLevelsMedialevelsImport
      parentRoute: typeof UniversalImport
    }
    '/_universal/levels/profile_levels': {
      id: '/_universal/levels/profile_levels'
      path: '/levels/profile_levels'
      fullPath: '/levels/profile_levels'
      preLoaderRoute: typeof UniversalLevelsProfilelevelsImport
      parentRoute: typeof UniversalImport
    }
    '/_private/admin/': {
      id: '/_private/admin/'
      path: '/admin'
      fullPath: '/admin'
      preLoaderRoute: typeof PrivateAdminIndexImport
      parentRoute: typeof PrivateImport
    }
    '/_private/details/$mediaType/$mediaId': {
      id: '/_private/details/$mediaType/$mediaId'
      path: '/details/$mediaType/$mediaId'
      fullPath: '/details/$mediaType/$mediaId'
      preLoaderRoute: typeof PrivateDetailsMediaTypeMediaIdImport
      parentRoute: typeof PrivateImport
    }
    '/_private/list/$mediaType/$username': {
      id: '/_private/list/$mediaType/$username'
      path: '/list/$mediaType/$username'
      fullPath: '/list/$mediaType/$username'
      preLoaderRoute: typeof PrivateListMediaTypeUsernameImport
      parentRoute: typeof PrivateImport
    }
    '/_private/profile/$username': {
      id: '/_private/profile/$username'
      path: '/profile/$username'
      fullPath: '/profile/$username'
      preLoaderRoute: typeof PrivateProfileUsernameImport
      parentRoute: typeof PrivateImport
    }
    '/_private/profile/$username/_header': {
      id: '/_private/profile/$username/_header'
      path: '/profile/$username'
      fullPath: '/profile/$username'
      preLoaderRoute: typeof PrivateProfileUsernameHeaderImport
      parentRoute: typeof PrivateProfileUsernameRoute
    }
    '/_private/stats/$mediaType/$username': {
      id: '/_private/stats/$mediaType/$username'
      path: '/stats/$mediaType/$username'
      fullPath: '/stats/$mediaType/$username'
      preLoaderRoute: typeof PrivateStatsMediaTypeUsernameImport
      parentRoute: typeof PrivateImport
    }
    '/_public/oauth2/$provider/callback': {
      id: '/_public/oauth2/$provider/callback'
      path: '/oauth2/$provider/callback'
      fullPath: '/oauth2/$provider/callback'
      preLoaderRoute: typeof PublicOauth2ProviderCallbackImport
      parentRoute: typeof PublicImport
    }
    '/_private/details/$mediaType/$job/$info': {
      id: '/_private/details/$mediaType/$job/$info'
      path: '/details/$mediaType/$job/$info'
      fullPath: '/details/$mediaType/$job/$info'
      preLoaderRoute: typeof PrivateDetailsMediaTypeJobInfoImport
      parentRoute: typeof PrivateImport
    }
    '/_private/details/form/$mediaType/$mediaId': {
      id: '/_private/details/form/$mediaType/$mediaId'
      path: '/details/form/$mediaType/$mediaId'
      fullPath: '/details/form/$mediaType/$mediaId'
      preLoaderRoute: typeof PrivateDetailsFormMediaTypeMediaIdImport
      parentRoute: typeof PrivateImport
    }
    '/_private/profile/$username/_header/followers': {
      id: '/_private/profile/$username/_header/followers'
      path: '/followers'
      fullPath: '/profile/$username/followers'
      preLoaderRoute: typeof PrivateProfileUsernameHeaderFollowersImport
      parentRoute: typeof PrivateProfileUsernameHeaderImport
    }
    '/_private/profile/$username/_header/follows': {
      id: '/_private/profile/$username/_header/follows'
      path: '/follows'
      fullPath: '/profile/$username/follows'
      preLoaderRoute: typeof PrivateProfileUsernameHeaderFollowsImport
      parentRoute: typeof PrivateProfileUsernameHeaderImport
    }
    '/_private/profile/$username/_header/history': {
      id: '/_private/profile/$username/_header/history'
      path: '/history'
      fullPath: '/profile/$username/history'
      preLoaderRoute: typeof PrivateProfileUsernameHeaderHistoryImport
      parentRoute: typeof PrivateProfileUsernameHeaderImport
    }
    '/_private/profile/$username/_header/': {
      id: '/_private/profile/$username/_header/'
      path: '/'
      fullPath: '/profile/$username/'
      preLoaderRoute: typeof PrivateProfileUsernameHeaderIndexImport
      parentRoute: typeof PrivateProfileUsernameHeaderImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  PrivateRoute: PrivateRoute.addChildren({
    PrivateComingnextRoute,
    PrivateGlobalstatsRoute,
    PrivateHalloffameRoute,
    PrivateSettingsRoute,
    PrivateTrendsRoute,
    PrivateAdminDashboardRoute,
    PrivateAdminIndexRoute,
    PrivateDetailsMediaTypeMediaIdRoute,
    PrivateListMediaTypeUsernameRoute,
    PrivateProfileUsernameRoute: PrivateProfileUsernameRoute.addChildren({
      PrivateProfileUsernameHeaderRoute:
        PrivateProfileUsernameHeaderRoute.addChildren({
          PrivateProfileUsernameHeaderFollowersRoute,
          PrivateProfileUsernameHeaderFollowsRoute,
          PrivateProfileUsernameHeaderHistoryRoute,
          PrivateProfileUsernameHeaderIndexRoute,
        }),
    }),
    PrivateStatsMediaTypeUsernameRoute,
    PrivateDetailsMediaTypeJobInfoRoute,
    PrivateDetailsFormMediaTypeMediaIdRoute,
  }),
  PublicRoute: PublicRoute.addChildren({
    PublicForgotpasswordRoute,
    PublicRegistertokenRoute,
    PublicResetpasswordRoute,
    PublicIndexRoute,
    PublicOauth2ProviderCallbackRoute,
  }),
  UniversalRoute: UniversalRoute.addChildren({
    UniversalAboutRoute,
    UniversalPrivacypolicyRoute,
    UniversalLevelsMedialevelsRoute,
    UniversalLevelsProfilelevelsRoute,
  }),
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.jsx",
      "children": [
        "/_private",
        "/_public",
        "/_universal"
      ]
    },
    "/_private": {
      "filePath": "_private.jsx",
      "children": [
        "/_private/coming_next",
        "/_private/global_stats",
        "/_private/hall_of_fame",
        "/_private/settings",
        "/_private/trends",
        "/_private/admin/dashboard",
        "/_private/admin/",
        "/_private/details/$mediaType/$mediaId",
        "/_private/list/$mediaType/$username",
        "/_private/profile/$username",
        "/_private/stats/$mediaType/$username",
        "/_private/details/$mediaType/$job/$info",
        "/_private/details/form/$mediaType/$mediaId"
      ]
    },
    "/_public": {
      "filePath": "_public.jsx",
      "children": [
        "/_public/forgot_password",
        "/_public/register_token",
        "/_public/reset_password",
        "/_public/",
        "/_public/oauth2/$provider/callback"
      ]
    },
    "/_universal": {
      "filePath": "_universal.jsx",
      "children": [
        "/_universal/about",
        "/_universal/privacy_policy",
        "/_universal/levels/media_levels",
        "/_universal/levels/profile_levels"
      ]
    },
    "/_private/coming_next": {
      "filePath": "_private/coming_next.jsx",
      "parent": "/_private"
    },
    "/_private/global_stats": {
      "filePath": "_private/global_stats.jsx",
      "parent": "/_private"
    },
    "/_private/hall_of_fame": {
      "filePath": "_private/hall_of_fame.jsx",
      "parent": "/_private"
    },
    "/_private/settings": {
      "filePath": "_private/settings.jsx",
      "parent": "/_private"
    },
    "/_private/trends": {
      "filePath": "_private/trends.jsx",
      "parent": "/_private"
    },
    "/_public/forgot_password": {
      "filePath": "_public/forgot_password.jsx",
      "parent": "/_public"
    },
    "/_public/register_token": {
      "filePath": "_public/register_token.jsx",
      "parent": "/_public"
    },
    "/_public/reset_password": {
      "filePath": "_public/reset_password.jsx",
      "parent": "/_public"
    },
    "/_universal/about": {
      "filePath": "_universal/about.jsx",
      "parent": "/_universal"
    },
    "/_universal/privacy_policy": {
      "filePath": "_universal/privacy_policy.jsx",
      "parent": "/_universal"
    },
    "/_public/": {
      "filePath": "_public/index.jsx",
      "parent": "/_public"
    },
    "/_private/admin/dashboard": {
      "filePath": "_private/admin/dashboard.jsx",
      "parent": "/_private"
    },
    "/_universal/levels/media_levels": {
      "filePath": "_universal/levels.media_levels.jsx",
      "parent": "/_universal"
    },
    "/_universal/levels/profile_levels": {
      "filePath": "_universal/levels.profile_levels.jsx",
      "parent": "/_universal"
    },
    "/_private/admin/": {
      "filePath": "_private/admin/index.jsx",
      "parent": "/_private"
    },
    "/_private/details/$mediaType/$mediaId": {
      "filePath": "_private/details/$mediaType.$mediaId.jsx",
      "parent": "/_private"
    },
    "/_private/list/$mediaType/$username": {
      "filePath": "_private/list/$mediaType.$username.jsx",
      "parent": "/_private"
    },
    "/_private/profile/$username": {
      "filePath": "_private/profile/$username",
      "parent": "/_private",
      "children": [
        "/_private/profile/$username/_header"
      ]
    },
    "/_private/profile/$username/_header": {
      "filePath": "_private/profile/$username/_header.jsx",
      "parent": "/_private/profile/$username",
      "children": [
        "/_private/profile/$username/_header/followers",
        "/_private/profile/$username/_header/follows",
        "/_private/profile/$username/_header/history",
        "/_private/profile/$username/_header/"
      ]
    },
    "/_private/stats/$mediaType/$username": {
      "filePath": "_private/stats/$mediaType.$username.jsx",
      "parent": "/_private"
    },
    "/_public/oauth2/$provider/callback": {
      "filePath": "_public/oauth2.$provider.callback.jsx",
      "parent": "/_public"
    },
    "/_private/details/$mediaType/$job/$info": {
      "filePath": "_private/details/$mediaType.$job.$info.jsx",
      "parent": "/_private"
    },
    "/_private/details/form/$mediaType/$mediaId": {
      "filePath": "_private/details/form.$mediaType.$mediaId.jsx",
      "parent": "/_private"
    },
    "/_private/profile/$username/_header/followers": {
      "filePath": "_private/profile/$username/_header/followers.jsx",
      "parent": "/_private/profile/$username/_header"
    },
    "/_private/profile/$username/_header/follows": {
      "filePath": "_private/profile/$username/_header/follows.jsx",
      "parent": "/_private/profile/$username/_header"
    },
    "/_private/profile/$username/_header/history": {
      "filePath": "_private/profile/$username/_header/history.jsx",
      "parent": "/_private/profile/$username/_header"
    },
    "/_private/profile/$username/_header/": {
      "filePath": "_private/profile/$username/_header/index.jsx",
      "parent": "/_private/profile/$username/_header"
    }
  }
}
ROUTE_MANIFEST_END */