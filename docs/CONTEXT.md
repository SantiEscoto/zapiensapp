# ZapCards - Memorize and Learn

## Problem Statement
Users struggle with information retention while learning new subjects. Current solutions in the market present several limitations:
- Lack of free, ad-free flashcard applications
- Limited advanced educational features
- Need for user-generated content marketplace
- Insufficient tools for effective learning retention

## Project Vision
ZapCards aims to be a simple yet powerful flashcard application focused on three core principles:
1. Memorize
2. Learn
3. Share

## Core Features

### 1. Collection Management
Users can manage their flashcard collections through two main interfaces:

#### 1.1 Collection Dashboard
- **Flashcard Deck Interface**
  - Creator profile view
  - Individual flashcard details
  - Classic review mode
    - Audio pronunciation
    - Card flipping mechanism
    - Difficulty-based spaced repetition
      - Easy cards appear less frequently
      - Hard cards appear more frequently
  - Learning mini-games
    - Quick review
    - Card matching
    - Stack building
    - Jumpman game
  - User comments
  - Collection management tools

#### 1.2 Discovery Tab
- **Search & Recommendations**
  - Default view shows recommendations
  - Search functionality
  - Advanced filtering options
    - Language
    - Sorting preferences
    - Additional filters

## User Journey
1. Access collection dashboard or discover new content
2. Select a flashcard deck
3. Choose learning mode (classic review or mini-games)
4. Practice and track progress
5. Engage with community through comments

## Key Differentiators
- Clean, ad-free experience
- Focus on simplicity and effectiveness
- Community-driven content
- Engaging learning mechanics

## Tech Stack
- Frontend: React Native with TypeScript, Expo and Expo Router
- Backend/Database: Supabase
- UI Framework: React Native Paper
- AI Processing: DeepSeek

## Database Schema

### Users Table
```sql
users (
  id uuid primary key,
  email text unique not null,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
)
```

### Collections Table
```sql
collections (
  id uuid primary key,
  creator_id uuid references users(id),
  title text not null,
  description text,
  is_public boolean default true,
  category text,
  language text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

### Flashcards Table
```sql
flashcards (
  id uuid primary key,
  collection_id uuid references collections(id),
  front_content text not null,
  back_content text not null,
  audio_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

### User_Progress Table
```sql
user_progress (
  id uuid primary key,
  user_id uuid references users(id),
  flashcard_id uuid references flashcards(id),
  difficulty_level integer,
  next_review timestamp with time zone,
  review_count integer default 0,
  last_reviewed timestamp with time zone,
  unique(user_id, flashcard_id)
)
```

### Comments Table
```sql
comments (
  id uuid primary key,
  user_id uuid references users(id),
  collection_id uuid references collections(id),
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
)
```

### User_Collections Table
```sql
user_collections (
  user_id uuid references users(id),
  collection_id uuid references collections(id),
  role text default 'viewer',
  created_at timestamp with time zone default now(),
  primary key (user_id, collection_id)
)
```

## Project Structure
```
zapcards/
├── app/                     # Expo Router app directory
│   ├── (auth)/             # Authentication routes
│   ├── (tabs)/             # Main tab navigation
│   └── _layout.tsx         # Root layout
├── src/
│   ├── components/         # Reusable components
│   │   ├── cards/          # Flashcard related components
│   │   ├── common/         # Common UI components
│   │   └── games/          # Mini-game components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and external services
│   │   ├── supabase/       # Supabase client and queries
│   │   └── ai/             # AI integration services
│   ├── store/              # Global state management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper functions and constants
├── assets/                 # Static assets
│   ├── images/
│   └── sounds/
├── docs/                   # Project documentation
└── config/                 # Configuration files
```