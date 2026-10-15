# Student Task Manager

A responsive task management website based on the Student Task Manager project abstract.

## Features
- Add, edit, and delete tasks
- Task title, description, priority, due date, and status
- Dashboard with total, pending, completed, and overdue task counts
- Upcoming deadlines and completion progress
- Search and filter by priority and status
- Completed tasks view
- Browser localStorage persistence
- Responsive layout for desktop and mobile

## Run the project
1. Download and extract `student_task_manager.zip`.
2. Open the extracted folder in Visual Studio Code.
3. Open `index.html` in your browser, or use the VS Code extension **Live Server** and select **Open with Live Server**.

No Node.js installation or database is required for this front-end version.

## Git and GitHub
Open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial Student Task Manager website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/student-task-manager.git
git push -u origin main
```

Create the repository on GitHub first and replace `YOUR-USERNAME` with your GitHub username.

## Note
Tasks are saved in the current browser on the current device. This starter version does not include user accounts or cloud synchronization.
