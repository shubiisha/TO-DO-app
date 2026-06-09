# 📝 To-Do App

A modern To-Do Application built using HTML, CSS, JavaScript, Firebase Authentication, and Firestore. Users can manage tasks, track progress, receive reminders, and organize tasks by date.

## 🚀 Features

### 🔐 Authentication
- User Signup
- User Login
- Secure Firebase Authentication
- Logout functionality

### ✅ Task Management
- Add Tasks
- Update Tasks
- Delete Tasks
- Mark Tasks as Completed
- Store tasks in Firebase Firestore

### 📅 Task Organization
- Today's Tasks
- This Week's Tasks
- This Month's Tasks
- Task History by Date

### 🔔 Notifications
- Browser Notification Support
- Daily task reminders when opening the application
- Notification toggle in Settings

### 📊 Progress Tracking
- Daily Completion Summary
- Progress Percentage Indicator
- Task Completion Tracking

### 🎨 User Experience
- Responsive Design
- Dark/Light Theme Toggle
- Mobile-Friendly Interface
- Installable as a Progressive Web App (PWA)

---

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES6)
- Firebase Authentication
- Firebase Firestore Database
- Netlify Hosting
- Progressive Web App (PWA)

---

## 📂 Project Structure

```text
project/
│
├── index.html
├── style.css
├── script.js
├── auth.js
├── todos.js
├── firebase.js
├── manifest.json
├── sw.js
│
├── icon/
│   └── icon-512.png
│
└── README.md
```

---

## ⚙️ Firebase Setup

### 1. Create Firebase Project

Visit:

https://console.firebase.google.com

### 2. Enable Authentication

Enable:

- Email/Password Authentication

### 3. Enable Firestore Database

Create Firestore Database in Test Mode.

### 4. Configure Firebase

Add your Firebase configuration inside:

```javascript
firebase.js
```

---

## 🌐 Deployment

This project is deployed using Netlify.

### Deploy Steps

1. Push project to GitHub
2. Connect repository to Netlify
3. Deploy automatically

Every new GitHub push automatically updates the live website.

---

## 📱 Progressive Web App (PWA)

This application supports installation on:

### Android

Chrome → Menu → Add to Home Screen

### iPhone

Safari → Share → Add to Home Screen

---

## 🔮 Future Enhancements

- Push Notifications using Firebase Cloud Messaging (FCM)
- APK Generation using Capacitor
- Recurring Tasks
- Task Categories
- Priority Levels
- Due Time Support
- Cloud Backup & Sync

---
