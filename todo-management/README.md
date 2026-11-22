# Task Management

Task Management is a web application for organizing tasks into Personal and Work categories. Users can register, sign in, manage their own tasks, and update their profile.

## Dashboard

The dashboard loads the authenticated user's tasks and the available categories. It calculates the KPI counts in the frontend from those responses:

- **Total Tasks** — number of tasks returned for the user.
- **Active Tasks** — tasks whose status is `ACTIVE`.
- **Completed Tasks** — tasks whose status is `COMPLETED`.
- **Personal Tasks** and **Work Tasks** — tasks whose `categoryId` matches each category's ID. Category cards are generated from the categories response; the seed provides the Personal and Work categories.

## What you can do

- **Authenticate:** register, log in, and log out. The dashboard, task pages, and profile require an authenticated session.
- **Manage tasks:** create tasks with an optional description, edit a task's name and description, switch its status between active and completed, and delete it.
- **Use categories:** view tasks under the seeded Personal and Work categories. There is no category creation or editing feature.
- **Clear a category:** remove all of the current user's tasks in the selected category. This deletes the tasks, not the category.
- **Manage your profile:** view and update your name, age, and profession.

## Documentation

- [**Application Setup Guide**](docs/TECHNICAL_SETUP.md) — Docker setup and the current Compose limitations.
- [**Technical Architecture and Implementation Details**](docs/TECHNICAL_DETAILS.md) — technology stack, Drizzle schema, data relationships, authentication, API, frontend architecture, and tests.
