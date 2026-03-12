import { pgTable, uuid, text, integer, timestamp, boolean, date, pgEnum, vector, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- AUTH.JS TABLES (Replacing Supabase Auth) ---

export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('user'), // user, admin
  region: text('region'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id').references(() => badges.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unq: [table.userId, table.badgeId],
}));

export const accounts = pgTable('account', {
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  pk: [account.provider, account.providerAccountId],
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// --- ECO-ATLAS TABLES (Migrated from Supabase) ---

export const userLevels = pgTable('user_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  xp: integer('xp').default(0),
  level: integer('level').default(1),
  rank: text('rank').default('🌱 Explorateur'),
  streakDays: integer('streak_days').default(0),
  lastActivityDate: date('last_activity_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  xpReward: integer('xp_reward').default(50),
  targetType: text('target_type').$type<'observations' | 'species' | 'alerts' | 'quiz' | 'login'>(),
  targetCount: integer('target_count').default(1),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
});

export const userChallenges = pgTable('user_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  unq: [table.userId, table.challengeId],
}));

export const species = pgTable('species', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  scientificName: text('scientific_name'),
  category: text('category').$type<'Fauna' | 'Flora'>().default('Fauna'), // faune, flore
  conservationStatus: text('conservation_status'), // CR, EN, VU, etc.
  description: text('description'),
  imageUrl: text('image_url'),
  habitat: text('habitat'),
  diet: text('diet'),
  populationEstimate: text('population_estimate'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const observations = pgTable('observations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  speciesId: uuid('species_id').references(() => species.id),
  location: text('location'), // POINT(lng lat)
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  imageUrl: text('image_url'),
  description: text('description'),
  isVerified: boolean('is_verified').default(false),
  type: text('type').$type<'observation' | 'alert'>().default('observation'),
  alertLevel: text('alert_level').$type<'low' | 'medium' | 'high' | 'critical'>().default('low'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const observationVotes = pgTable('observation_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  observationId: uuid('observation_id').references(() => observations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  vote: text('vote').$type<'confirm' | 'reject' | 'unsure'>().notNull(),
  comment: text('comment'),
  suggestedSpeciesId: uuid('suggested_species_id').references(() => species.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unq: [table.userId, table.observationId],
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body'),
  type: text('type').$type<'alert' | 'badge' | 'challenge' | 'community' | 'system'>(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  key: text('api_key').notNull().unique(),
  name: text('name').default('Ma Clé API'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiLogs = pgTable('api_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  responseCode: integer('response_code'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  category: text('category'), // Actualités, Projets, etc.
  authorId: uuid('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  speciesId: uuid('species_id').references(() => species.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  speciesId: uuid('species_id').references(() => species.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unq: [table.userId, table.speciesId],
}));

export const protectedAreas = pgTable('protected_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  surfaceArea: text('surface_area'),
  establishedYear: integer('established_year'),
  description: text('description'),
  imageUrl: text('image_url'),
  type: text('type'), // Parc National, Réserve, etc.
  areaKm2: doublePrecision('area_km2'),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ecoTrails = pgTable('eco_trails', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  difficulty: text('difficulty').$type<'easy' | 'moderate' | 'hard'>().default('easy'),
  durationHours: doublePrecision('duration_hours'),
  distanceKm: doublePrecision('distance_km'),
  imageUrl: text('image_url'),
  isFeatured: boolean('is_featured').default(false),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  trailId: uuid('trail_id').references(() => ecoTrails.id, { onDelete: 'cascade' }),
  bookingDate: date('booking_date').notNull(),
  status: text('status').$type<'pending' | 'confirmed' | 'cancelled'>().default('pending'),
  participants: integer('participants').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const votes = pgTable('votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  observationId: uuid('observation_id').references(() => observations.id, { onDelete: 'cascade' }),
  voteType: text('vote_type').$type<'up' | 'down'>().default('up'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unq: [table.userId, table.observationId],
}));

export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  difficulty: text('difficulty').default('Moyen'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  options: text('options').array().notNull(),
  correctIndex: integer('correct_index').notNull(),
  explanation: text('explanation'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizResults = pgTable('quiz_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
});

export const forumThreads = pgTable('forum_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').default('general'),
  imageUrl: text('image_url'),
  upvotes: integer('upvotes').default(0),
  repliesCount: integer('replies_count').default(0),
  isPinned: boolean('is_pinned').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forumReplies = pgTable('forum_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').references(() => forumThreads.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isExpertAnswer: boolean('is_expert_answer').default(false),
  upvotes: integer('upvotes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const localGuides = pgTable('local_guides', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  languages: text('languages').array().notNull(),
  specialties: text('specialties').array(),
  rating: doublePrecision('rating').default(5.0),
  pricePerDay: integer('price_per_day'),
  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'), // Loi, Rapport, Guide
  fileUrl: text('file_url').notNull(),
  sizeMb: doublePrecision('size_mb'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentaries = pgTable('documentaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  duration: text('duration'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const missions = pgTable('missions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  targetCount: integer('target_count').default(10),
  currentCount: integer('current_count').default(0),
  imageUrl: text('image_url'),
  status: text('status').default('active'), // active, completed
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentaryComments = pgTable('documentary_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentaryId: uuid('documentary_id').references(() => documentaries.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const missionMessages = pgTable('mission_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  missionId: uuid('mission_id').references(() => missions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  eventDate: timestamp('event_date').notNull(),
  location: text('location'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  pushEnabled: boolean('push_enabled').default(true),
  alertRadiusKm: integer('alert_radius_km').default(50),
  alertTypes: text('alert_types').array().default(['critical', 'high']),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ one, many }) => ({
  level: one(userLevels, {
    fields: [users.id],
    references: [userLevels.userId],
  }),
  challenges: many(userChallenges),
  observations: many(observations),
  notifications: many(notifications),
  apiKeys: many(apiKeys),
  articles: many(articles),
  comments: many(comments),
  favorites: many(favorites),
  bookings: many(bookings),
  votes: many(votes),
  quizResults: many(quizResults),
  forumThreads: many(forumThreads),
  forumReplies: many(forumReplies),
  observationVotes: many(observationVotes),
  missionMessages: many(missionMessages),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  observations: many(observations),
  comments: many(comments),
  favorites: many(favorites),
  observationVotes: many(observationVotes),
}));

export const observationsRelations = relations(observations, ({ one, many }) => ({
  user: one(users, {
    fields: [observations.userId],
    references: [users.id],
  }),
  species: one(species, {
    fields: [observations.speciesId],
    references: [species.id],
  }),
  votes: many(votes),
  observationVotes: many(observationVotes),
}));

export const observationVotesRelations = relations(observationVotes, ({ one }) => ({
  user: one(users, {
    fields: [observationVotes.userId],
    references: [users.id],
  }),
  observation: one(observations, {
    fields: [observationVotes.observationId],
    references: [observations.id],
  }),
  suggestedSpecies: one(species, {
    fields: [observationVotes.suggestedSpeciesId],
    references: [species.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  species: one(species, {
    fields: [favorites.speciesId],
    references: [species.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  logs: many(apiLogs),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  species: one(species, {
    fields: [comments.speciesId],
    references: [species.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  userChallenges: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [userChallenges.challengeId],
    references: [challenges.id],
  }),
}));

export const ecoTrailsRelations = relations(ecoTrails, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  trail: one(ecoTrails, {
    fields: [bookings.trailId],
    references: [ecoTrails.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  observation: one(observations, {
    fields: [votes.observationId],
    references: [observations.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  questions: many(questions),
  results: many(quizResults),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  user: one(users, {
    fields: [quizResults.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizResults.quizId],
    references: [quizzes.id],
  }),
}));

export const forumThreadsRelations = relations(forumThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [forumThreads.authorId],
    references: [users.id],
  }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  thread: one(forumThreads, {
    fields: [forumReplies.threadId],
    references: [forumThreads.id],
  }),
  author: one(users, {
    fields: [forumReplies.authorId],
    references: [users.id],
  }),
}));

export const missionsRelations = relations(missions, ({ many }) => ({
    messages: many(missionMessages)
}));

export const missionMessagesRelations = relations(missionMessages, ({ one }) => ({
    mission: one(missions, {
        fields: [missionMessages.missionId],
        references: [missions.id]
    }),
    user: one(users, {
        fields: [missionMessages.userId],
        references: [users.id]
    })
}));
