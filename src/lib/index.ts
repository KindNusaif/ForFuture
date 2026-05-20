export { isSupabaseConfigured, requireSupabase, supabase } from './supabase'
export { formatError } from './errors'
export {
  ensureProfile,
  getProfile,
  getSession,
  signIn,
  signOut,
  resendSignupConfirmation,
  signUp,
  type SignUpResult,
} from './auth'
export {
  createPost,
  DEFAULT_FEED_PAGE_SIZE,
  fetchPosts,
  fetchPostsByUser,
  fetchPostsPage,
  getTotalSupportForUser,
} from './posts'
export {
  attachActionCounts,
  attachSupportCounts,
  enrichPostsWithActions,
  enrichPostsWithSupport,
  fetchPostActionsForPosts,
  fetchSupportsForPosts,
  togglePostAction,
  toggleSupport,
} from './postActions'
export {
  castPollVote,
  enrichPostsWithPolls,
  getTotalPollVotesReceived,
  insertPollOptions,
  POLL_OPTION_MAX,
  POLL_OPTION_MIN,
} from './polls'
