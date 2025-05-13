# KeLink Implementation TODO

## Backend (Next.js)

- [ ] **Project Setup:**
  - [x] Install dependencies: `firebase-admin`, `bcrypt`, `jsonwebtoken`.
  - [x] Configure environment variables (`.env`) for Firebase credentials.
  - [x] Initialize Firebase Admin SDK.
- [ ] **Vendor Endpoints:**
  - [x] `/api/vendors/register`: Implement vendor registration logic (hash password, save to Firestore).
  - [x] `/api/vendors/login`: Implement vendor login logic (verify credentials, generate token - JWT).
  - [x] `/api/vendors/profile`: Implement authenticated endpoint for vendor profile CRUD.
  - [x] `/api/vendors/location`: Implement authenticated endpoint to receive and update vendor location and `is_active` status in Firestore.
  - [x] `/api/vendors/route-advice`: Implement authenticated endpoint:
    - [x] Receive vendor input (target areas/stops, vendor type, time).
    - [x] Construct a suitable prompt for an AI API (gemini-2.5-flash-001).
    - [x] Call generative AI to get advice.
    - [x] Return the generated advice.
- [ ] **Find Endpoint (`/api/find`):**
  - [ ] Implement the findNearbyVendors function to search vendors near a location.
  - [ ] Implement the endpoint logic:
    - [ ] Receive user query and location.
    - [ ] Use AI to determine if the query is looking for vendors.
    - [ ] If needed, search for nearby vendors in Firestore.
    - [ ] Format response with vendor information.
    - [ ] Return the response to the user.

## Frontend (Vendor - Next.js)

- [ ] **Authentication:** Implement login/registration forms, token handling.
- [ ] **Profile:** Create view/edit profile screen, integrate with backend API.
- [ ] **Dashboard:** Display basic info, add "Go Live" / "Go Offline" toggle calling the `/api/vendors/location` endpoint (requires getting device location).
- [ ] **Route Advice:** Create UI to input areas/details and display advice from `/api/vendors/route-advice`.

## Frontend (Customer - Next.js)

- [ ] **Chat UI:** Create input field and message display area.
- [ ] **API Interaction:**
  - [ ] On submit, get user's geolocation (request permission).
  - [ ] Send user message and location to `/api/chatbot` endpoint.
  - [ ] Display responses (user messages and bot replies) in the chat area.

## Deployment & Testing

- [ ] Set up hosting for the Next.js application (e.g., Vercel).
- [ ] Thoroughly test all vendor flows.
- [ ] Thoroughly test the chatbot function.
- [ ] Test geolocation permissions and handling.
