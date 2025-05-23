## Description
Gradebook is a course and assignment management tool designed for students (mostly me). It helps me track grades, and visualize course progress with graphs. The app includes secure login and signup through OAuth, and reliable data storage through the firebase RTDB.

## Features
- Add, edit, and delete courses and assignments.
- Calculate weighted grades and track assignment completion.
- Visualize performance using graphs (grades, weights, and completion rates).
- OAuth-based login and signup.
- Save data locally or sync with the cloud.

## Technologies Used  
- **HTML5, CSS3, JavaScript**: Structure, styling, and DOM element management.
- **Chart.js**: Graphing library for visualizing data.
- **OAuth**: Authentication for login and signup provided through the Google API.
- **Firebase Realtime Database**: For storing and syncing course data in real-time across devices.
- **Font Awesome**: Icons for a nicer UI.

## Setup  
1. Clone the repository:
   ```bash
   git clone <repository_url>
   ```
2. Navigate to the project folder:
   ```bash
   cd gradebook
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Open `index.html` in your browser:
   ```bash
   open index.html
   ```

## Future Plans  
- **Improved Mobile Support**: Fully responsive UI for mobile use, current UI isn't bad but needs some TLC.
- **Custom Reports**: Generate detailed reports for grades and progress, automatically know where you're (s)lacking.
- **User Customization**: Add themes and personalization options to the UI.
