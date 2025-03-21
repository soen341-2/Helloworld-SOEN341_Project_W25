# Sprint 2 Contribution Log

## Marco Greco (40285114)

### Fixed GitHub Remote Repository
- **March 4, 13:00 - 14:30**  
  - Researched CI/CD pipeline  
  - Researched Jest and Jasmine Framework  
  - Decided to use Jasmine because Angular CLI automatically generates component test files in Jasmine Framework on component generation  

### Edited Jasmine Framework Unit Tests
- **March 3, 16:00 - 17:30**  
  - Edited Jasmine Framework unit test files generated by Angular CLI  
  - Added several imports to ensure unit tests run properly and pass  

### Wrote .github/workflows/Component-Tests.yml File
- **March 5, 10:45 - 11:10**  
  - Created `.yml` file that checks out repository, installs dependencies and Chrome, then runs unit tests  

### Created and Tested GitHub Action for Component Tests on Push
- **March 5, 11:15 - 12:00**  
  - Implemented a GitHub action that runs “Component Tests” on every push  

### Edited Styling for Webpage Components and Fixed Username Functionality
- **March 5, 12:00 - 12:05**  
  - Added navbar to components, including buttons for navigation and logout  
  - Moved the “Active Chats” section under the “Channel Selection” section  

### Additional Contributions
- **March 4/5, 21:30 - 00:00**  

---

## Liyan Al-mosaria (40251099)

### Wrote User Stories for Sprint 2
- **February 14, 12:00PM - 1:30PM**  
  - Added user stories as issues in GitHub repository  

### Wrote Acceptance Tests for Sprint 1
- **February 14, 1:30PM - 2:30PM**  
  - Added acceptance tests as issues in GitHub repository  

### Worked on Spillover from Sprint 1
- **February 15, 7PM - 9PM & February 16, 4PM - 8PM**  
  - Set up Firebase in Angular  
  - Created `UserAuthComponent`  
  - Implemented Sign-Up, Login, and Logout functionality  
  - Managed authentication state  
  - Enhanced UI and navigation  

### Implemented Admin Moderation for Messages (Delete Button)
- **March 2, 4PM - 9PM**  
  - Enabled admins to delete messages  
  - Integrated Firestore document deletion  
  - Ensured delete button is only visible to admins  

### Kept Track of Meeting Minutes
- **March 6, 4:30PM - 5PM**  
  - Saved meeting minutes in shared Google Drive  
  - Updated Sprint 2 meeting minutes in GitHub repository  

### Updated `User Stories.md` for Sprint 2
- **March 6, 5PM - 5:10PM**  
  - Linked all Sprint 2 user stories in `User Stories.md`  

---

## Alexia Mucciacciaro (40250572)

### Set Up Firebase in Angular Project
- **February 25, 3PM - 4PM**  
  - Installed AngularFire  
  - Connected project to Firebase  

### Worked on User Story 8 (Sending Messages in a Text Channel)
- **February 26, 1PM - 5PM & February 28, 2PM - 6PM**  
  - Researched and implemented Channel chat area  
  - Implemented functions to get Channel name and Username from Firebase  
  - Developed message sending, storing, and displaying functionalities  
  - Designed and implemented UI for chat system  

---

## Prathiksha Kandiah (40190782)

### Worked on Spillover from Sprint 1 (with Liyan and Sarah)
- **February 14, 12PM - 1:30PM**  

### Setup and Verified Angular
- **March 4, 5PM - 5:30PM**  
  - Ensured Angular was correctly set up on PC  

### Pulled GitHub Code for Updated Version
- **March 4, 5:30PM - 6PM**  

### Worked on Private Chats Between Users
- **March 4, 6PM - 8PM**  
  - Researched private messaging implementation  

### Code Modifications for Private Chats
- **March 5, 9AM - 9:40AM**  
  - Modified `channel-area.component.ts`  
- **March 5, 10AM - 10:30AM**  
  - Modified `channel-selector.component.ts` to include `isPrivate: true`  
  - Fixed errors  
- **March 5, 10:30AM - 10:45AM**  
  - Modified `channel.ts` to export `interface channel`  
- **March 6, 12PM - 2PM**  
  - Fixed `loadMessages` function in `channel-area.component.ts`  
- **March 6, 6PM - 9PM**  

---

## Sarah Amani

### Implemented Direct Chat Functionality
- **March 1, 10AM - 2PM**  
  - Developed a system for users to send direct messages  
  - Implemented user selection for starting direct chats  
  - Ensured users can only chat with registered users  

### Firebase Integration for Direct Chat
- **March 2, 2PM - 5PM**  
  - Integrated Firestore for message storage  
  - Implemented queries for retrieving messages between two users  
  - Used Firestore's `onSnapshot` for real-time chat updates  
  - Structured Firestore collection as `directMessages` with `senderID_receiverID`  
  - Merged conversations between same users (A → B and B → A)  

### User Authentication Integration
- Retrieved current logged-in user details for chat personalization  
- Ensured chat history visibility is restricted to the involved users  

### Chat Functionalities
- Implemented functions for retrieving, displaying, and sending messages  
- Stored messages in Firestore with sender ID, receiver ID, timestamp, and message content  

---


