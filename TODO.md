# KeLink Implementation TODO

## Backend (Next.js)

- [x] **Project Setup:**
  - [x] Install dependencies: `firebase-admin`, `bcrypt`, `jsonwebtoken`.
  - [x] Configure environment variables (`.env`) for Firebase credentials.
  - [x] Initialize Firebase Admin SDK.
- [x] **Peddler Endpoints:**
  - [x] `/api/peddlers/register`: Implement peddler registration logic (hash password, save to Firestore).
  - [x] `/api/peddlers/login`: Implement peddler login logic (verify credentials, generate token - JWT).
  - [x] `/api/peddlers/profile`: Implement authenticated endpoint for peddler profile CRUD.
  - [x] `/api/peddlers/location`: Implement authenticated endpoint to receive and update peddler location and `is_active` status in Firestore.
  - [x] `/api/peddlers/route-advice`: Implement authenticated endpoint:
    - [x] Receive peddler input (target areas/stops, peddler type, time).
    - [x] Construct a suitable prompt for an AI API (gemini-2.5-flash-001).
    - [x] Call generative AI to get advice.
    - [x] Return the generated advice.
- [x] **Find Endpoint (`/api/find`):**
  - [x] Implement the findNearbyVendors function to search peddlers near a location.
  - [x] Implement the endpoint logic:
    - [x] Receive user query and location.
    - [x] Use AI to determine if the query is looking for peddlers.
    - [x] If needed, search for nearby peddlers in Firestore.
    - [x] Format response with peddler information.
    - [x] Return the response to the user.

## Frontend (Peddler - Next.js)

- [x] **Authentication:** Implement login/registration forms, token handling.
- [x] **Profile:** Create view/edit profile screen, integrate with backend API.
- [x] **Dashboard:** Display basic info, add "Go Live" / "Go Offline" toggle calling the `/api/peddlers/location` endpoint (requires getting device location).
- [x] **Route Advice:** Create UI to input areas/details and display advice from `/api/peddlers/route-advice`.

## Frontend (Customer - Next.js)

- [x] **Chat UI:** Create input field and message display area.
- [x] **API Interaction:**
  - [x] On submit, get user's geolocation (request permission).
  - [x] Send user message and location to `/api/find` endpoint.
  - [x] Display responses (user messages and bot replies) in the chat area.

## Performance Optimization

- [x] Implement caching strategies for repeated queries
- [x] Optimize Firebase queries for faster peddler lookups
- [x] Implement pagination for peddler results when multiple peddlers are found
- [x] Add loading states and optimistic UI updates

## User Experience Enhancements

- [x] Add peddler ratings and review system
- [ ] Implement user favorites/bookmarks for frequently accessed peddlers
- [ ] Create peddler category filters for the find interface
- [ ] Add push notifications for peddler proximity alerts
- [ ] Implement history of past interactions/searches
- [x] Add best route to peddler and vice versa (using Google Maps MCP (Model Context Protocol))
- [ ] Add peddler details to the find interface
- [ ] Add rehype markdown for rich text messages in chat (configure the gemini responses too)

## Security & Compliance

- [x] Implement rate limiting for API endpoints
- [ ] Add data retention policies for user location data
- [x] Ensure GDPR/CCPA compliance for user data

## Analytics & Monitoring

- [ ] Implement analytics to track user engagement
- [ ] Create dashboard for peddler usage statistics

## Documentation & Onboarding

- [ ] Create comprehensive API documentation
- [ ] Add peddler onboarding guide/tutorial
- [ ] Document codebase with JSDoc comments
- [ ] Create user help/FAQ section

## Future Enhancements

- [ ] Implement real-time updates for peddler locations
- [ ] Add in-app messaging between users and peddlers
- [ ] Explore integration with mapping services for visual peddler tracking
- [ ] Support for scheduled peddler appearances/events

## Deployment & Testing

- [x] Set up hosting for the Next.js application (e.g., Vercel).
- [ ] Thoroughly test all peddler flows.
- [ ] Thoroughly test the chatbot function.
- [x] Test geolocation permissions and handling.
