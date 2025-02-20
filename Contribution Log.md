## CONTRIBUTION LOG

### SPRINT 1

#### Marco Greco 40285114

- Wrote user stories for Sprint 1
  -Started on January 31, 2025
  -Wrote 7 user stories based on “User Authentication and Management” Requirements
  -30 minutes
  
- Created and set up Angular Project
  -Initialized the project to start writing code
  -Added channel-selector component
  -Includes HTML, CSS, and TypeScript code for contributions
  -Added Channel and activeChannel interfaces
    -Channel has a string ID and string Title
    -activeChannel has the ID and Title of the channel selected by the user
  -Set up Firebase environment file
  -2 hours
  
- Created UI for channel list (including “Add Channel” button and “Channel Title” form)
  -Started on February 2, 2025
  -Created sidebar using Bootstrap
  -1 hour

- Added functionality to the “Add Channel” button and “Channel Title” form
  -Started on February 2, 2025
  -Wrote a TypeScript function that adds a channel with a custom title from the form to an array when the button is clicked
  -Wrote HTML code to display all created channels on the sidebar
  -1 hour

- Created "Delete" button for each channel added
  -Wrote HTML code to display a button underneath every channel labeled "Delete"
  -30 minutes

- Added functionality to "Delete" button
  -Wrote TypeScript code to remove the deleted channel from the array based on the index of the selected channel
  -Channel is deleted from view when removed from the array
  -30 minutes

- Set up Firestore database in Google Firebase and stored user-created channels in the database
  -Created a "channels" collection in Firestore
  -Wrote a TypeScript function to add a document to the "channels" collection every time a channel is created. The document stores the ID     and title of the channel
  -2 hours

- Removed channel from Firestore when deleted
  -Wrote a TypeScript function
  -30 minutes

#### Liyan Al-mosaria 40251099

- Wrote README.md file on GitHub
  -1 hour
  
- Wrote User Stories.md on GitHub
  -30 minutes

- Created the Angular structure for the registration form
  -Developed the HTML template for the form in an Angular component
  -2 hours

- Implemented TypeScript logic to toggle between sign-in and sign-up forms when clicking on respective buttons
  -1 hour

- Set up a Firebase project in the Firebase Console
  -30 minutes

- Enabled Firebase Authentication (Email/Password method)
  -30 minutes

- Installed and configured the Firebase SDK in Angular
  -30 minutes

- Created an Angular service to handle authentication logic
  -1 hour

- Tested authentication logic with valid/invalid email formats 
  -15 minutes

#### Alexia Mucciacciaro 40250572

- Wrote meeting minutes
  -Documented date, time, and format of meetings
  -Noted attendance and discussion points
  -15 minutes per meeting

- Wrote user stories
  -30 minutes

- Downloaded and set up Angular
  -30 minutes

- Set up GitHub repository
  -15 minutes

- Created Angular component for Logout 
  -Developed HTML layout for the logout page
  -Styled the page with CSS
  -2 hours

- Implemented logout logic in TypeScript
  -Redirects user to the login page when clicking "Logout" button
  -30 minutes

#### Prathiksha Kandiah 40190782
- Downloaded and installed VS Code
  -1 hour

- Installed and set up Angular
  -45 minutes

- Set up GitHub
  -10 min

- Involved in the design of
  -Designed title of the website*
  -Added login icon picture*
  -Created username input box*
  -Created password input box*
  -Created login submit button*
  -Created "Create Account" link (navigates to create an account page)*
  -Added background styling*
  -Edited colors, format, and design*
  -~8 hours
  -* some errors occurred, forcing to erase these parts
  -Wrote channel-area for user story 6 and 7 with Sarah

#### Sarah Amani 40226234

- User Story Assignment
  -Assigned user stories among team members assignUserToChannel() and toggleUserChannel() function
  -30 minutes

- Project Setup
  -Installed Angular
  -1 hour

- Created the GitHub repository with main components for the team
  -2 hours

- Development of Admin assigns users to channels 
  -Frontend: Designed a dropdown or search field to select users (completed)
  -Backend: Modified Firestore to store user-channel relationships (completed)
  -Integration: Implemented logic to assign users to channels (completed)

- Development of Viewing channels accessible to a user
  -Frontend: Created a sidebar/list view to display available channels (3h, not completed)
  -Backend: Fetched only channels where the user is assigned (2h, completed)
  -Integration: Integrated Firebase real-time updates to show new channels dynamically (45 min, not completed)

- Code contributions included in “Admin Dashboard” 


#### Note : The beginning of our project, each team member worked individually on their assigned User Stories. However, as we progressed, we realized that to ensure better cohesion and smoother integration of features, it was more effective to merge our work and collaborate more closely.
#### Because of this, while some User Stories were initially assigned to individuals, everyone contributed to multiple aspects of the project during the integration phase. Each team member helped in different areas, whether by fixing bugs, improving the UI, or optimizing the code to ensure compatibility between modules.
#### We want to emphasize that this project was a collective effort, and every team member actively participated in making it come together. If some contributions seem less visible at first glance, it’s only because we worked as a team rather than staying strictly within our individual assignments.
#### Thank you for your understanding, and please feel free to reach out if you have any questions!



