# 🥗 CalorieTrack AI

### Your food. Your fitness. Your progress.

**CalorieTrack AI** is a mobile-first calorie and nutrition tracking application designed around Indian food habits. It helps users track daily calorie intake, macronutrients, exercise, hydration, and weight progress through a simple, personalized dashboard.

The goal is to make nutrition tracking practical for everyday Indian meals—from idli and dosa to biryani, chapati, curries, snacks, and homemade recipes.

<p align="center">
  <a href="https://calorietrack-ai.hatchable.site">
    <strong>🚀 Live Demo</strong>
  </a>
  &nbsp; • &nbsp;
  <a href="#-features">Features</a>
  &nbsp; • &nbsp;
  <a href="#-technology-stack">Technology Stack</a>
  &nbsp; • &nbsp;
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 📌 About the Project

Many calorie-tracking applications focus on generic food databases, making it difficult to accurately track regional meals, homemade dishes, and Indian serving sizes.

CalorieTrack AI addresses this challenge with an Indian-food-focused catalogue, portion-based food logging, personalized nutrition goals, and daily health tracking in one responsive application.

### 🎯 Project Objectives

- Make calorie tracking easier for Indian meals.
- Monitor daily calories and macronutrients.
- Track calories burned through physical activity.
- Encourage consistent hydration and weight tracking.
- Support custom foods and ingredient-based recipes.
- Provide a mobile-friendly experience for everyday use.

## ✨ Features

### 🍛 Indian Food Tracking
- Search a curated catalogue of Indian dishes and ingredients.
- Find foods using supported alternative names, including Tamil food names.
- Record meals under breakfast, lunch, dinner, and snacks.
- Adjust serving quantities and estimate nutritional intake.
- Add custom foods with their own nutrition values.

### 📊 Daily Nutrition Dashboard
- Track daily calorie consumption.
- Monitor protein, carbohydrates, and fat.
- View remaining calories against a personal daily goal.
- Review activity and estimated energy expenditure.
- Organize food intake by date and meal.

### 🏃 Exercise Tracking
- Log activities such as walking, running, cycling, gym workouts, swimming, and yoga.
- Record exercise duration and estimated calories burned.
- Review activity alongside daily food intake.

### 💧 Hydration Tracking
- Log daily water consumption.
- Set a personal hydration target.
- Monitor progress toward the daily goal.

### ⚖️ Weight and Goal Tracking
- Record weight measurements over time.
- Set a target weight.
- Configure personal calorie and macronutrient goals.
- Review weight history and progress.

### 🍲 Custom Recipes
- Create recipes from individual food ingredients.
- Specify ingredient quantities and the number of servings.
- Calculate estimated nutrition per serving.
- Save recipes for repeat use.

### ⭐ Food Favourites
- Save frequently eaten foods.
- Filter the food catalogue to find favourites quickly.
- Remove saved favourites when preferences change.

### 📱 Mobile-First Experience
- Responsive layout for phones, tablets, and desktops.
- Touch-friendly food search and serving controls.
- Mobile navigation designed for quick daily logging.

### 🔐 User Accounts and Data
- Email-based authentication.
- Personal profiles and nutrition preferences.
- User-scoped food logs, activity records, and recipes.
- Database-backed storage for tracking history.

## 🖥️ Application Preview

The application includes a daily dashboard, food diary, nutrition tracking, exercise logging, hydration tracking, weight history, and recipe management.

**Explore the deployed application:**  
https://calorietrack-ai.hatchable.site

> Screenshots can be added here as the interface is captured on desktop and mobile devices.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Application platform | Hatchable |
| Frontend | HTML5, CSS3, JavaScript |
| Backend | JavaScript API functions |
| Database | PostgreSQL |
| Database schema | SQL migrations |
| Authentication | Hatchable email authentication |
| Deployment | Hatchable hosting |

The project uses Hatchable's application runtime and managed PostgreSQL database. It does not currently use a separate MERN backend.

## 🏗️ Architecture

The application separates the user interface, API endpoints, and persistent data storage.

```text
                ┌──────────────────────┐
                │     User Interface   │
                │ HTML / CSS / JavaScript │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │    API Endpoints     │
                │ Food · Diary · Goals │
                │ Activity · Water     │
                │ Weight · Recipes     │
                │ Favourites           │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │     PostgreSQL       │
                │ Profiles and Logs    │
                │ Foods and Recipes    │
                └──────────────────────┘
```

### Core Modules

- **Food API:** Search foods and manage custom food entries.
- **Diary API:** Create, edit, and remove logged meals.
- **Dashboard API:** Retrieve daily nutrition and activity summaries.
- **Activity API:** Record physical activity.
- **Water API:** Manage hydration records.
- **Weight API:** Maintain weight history.
- **Recipes API:** Create and manage ingredient-based recipes.
- **Favourites API:** Save and retrieve preferred foods.
- **Profile API:** Manage personal details and nutrition goals.

## 🚀 Getting Started

### Option 1: Try the Live Application

1. Open https://calorietrack-ai.hatchable.site.
2. Sign in or register when public access is enabled.
3. Set up your personal profile and daily goals.
4. Start recording meals, activity, water, and weight.

### Option 2: Deploy Your Own Copy

This repository is structured as a Hatchable project rather than a conventional Node.js application.

1. Obtain the complete project files.
2. Visit https://hatchable.com/deploy.
3. Import the project ZIP or a Git repository containing the project.
4. Configure the required platform services and authentication.
5. Deploy the project and verify its database migrations and API endpoints.

A separate local development setup with `npm install` and `npm run dev` is not currently documented for this project.

## 🗺️ Roadmap

Planned improvements for future versions include:

- [ ] AI-assisted food recognition from meal photos.
- [ ] Nutrition estimation with image-assisted portion analysis.
- [ ] Barcode scanning for packaged foods.
- [ ] Expanded regional Indian food database.
- [ ] Weekly and monthly nutrition reports.
- [ ] Exportable food and weight history.
- [ ] Apple Health and Android Health Connect integration.
- [ ] Progressive Web App installation and offline support.
- [ ] Automated tests and a documented local development workflow.

These items are planned improvements and are not represented as existing features.

## 🔬 Accuracy and Limitations

CalorieTrack AI is intended for general nutrition awareness and personal tracking.

- Nutrition values may be estimates and can vary by recipe, ingredients, cooking oil, serving size, and preparation method.
- Exercise calorie estimates are approximate and should not be treated as precise measurements.
- The application is not a medical diagnostic tool or a replacement for professional dietary advice.
- AI-powered photo recognition and automatic health-device synchronization are not currently implemented.

For better estimates, use measured portions and enter the actual ingredients used in homemade meals.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test the affected functionality.
4. Submit a pull request describing the improvement.

Ideas for contributions include regional food data, accessibility, responsive design, automated testing, and nutrition calculation improvements.

## 📄 License

No license has been specified yet. Add an appropriate open-source license before inviting others to reuse or redistribute the project.

---

<p align="center">
  <strong>Built to make everyday nutrition tracking simpler. 🥗</strong>
  <br />
  <sub>CalorieTrack AI — Indian food, informed choices, consistent progress.</sub>
</p>
