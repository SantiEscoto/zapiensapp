# App Directory Structure Proposal

## Proposed Structure
```
app/
├── (auth)/                    # Authentication related screens
│   ├── _layout.tsx            # Auth layout configuration
│   ├── login.tsx              # Login screen
│   ├── register.tsx           # Registration screen
│   └── forgot-password.tsx    # Password recovery screen
├── (main)/                    # Main app screens
│   ├── _layout.tsx            # Main layout with bottom tabs
│   ├── (home)/                # Home tab related screens
│   │   ├── index.tsx          # Home screen (deck list)
│   │   └── deck/              # Deck related screens
│   │       ├── [id].tsx       # Individual deck view
│   │       ├── create.tsx     # Create new deck
│   │       └── edit/[id].tsx  # Edit deck
│   ├── (study)/               # Study tab related screens
│   │   ├── index.tsx          # Study dashboard
│   │   └── session/           # Study session screens
│   │       ├── [id].tsx       # Active study session
│   │       └── results.tsx    # Session results
│   └── (profile)/             # Profile tab related screens
│       ├── index.tsx          # Profile dashboard
│       └── settings.tsx       # User settings
└── _layout.tsx                # Root layout configuration

## Implementation Guide

1. Create the directory structure above

2. Update imports and navigation references

3. Benefits of New Structure:
   - Feature-based organization
   - Better scalability
   - Clearer navigation flow
   - Easier to maintain and extend
   - Better separation of concerns

## Code Organization Guidelines

1. Components:
   - Keep screen-specific components within their feature folders
   - Move shared components to src/components
   - Use index.ts files for clean exports

2. Navigation:
   - Use meaningful route names
   - Group related screens in their own folders
   - Keep layouts close to their routes

3. State Management:
   - Keep screen-specific state within components
   - Move shared state to global store
   - Use hooks for complex state logic

4. Code Style:
   - Use TypeScript for better type safety
   - Follow consistent naming conventions
   - Add JSDoc comments for complex logic
   - Keep components focused and single-responsibility"