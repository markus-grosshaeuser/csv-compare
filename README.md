# CSV Compare

![](https://github.com/markus-grosshaeuser/badges/blob/main/versions/version_1_0_1.svg)
![](https://github.com/markus-grosshaeuser/badges/blob/main/languages/TypeScript-v6.0.3.svg)
![](https://github.com/markus-grosshaeuser/badges/blob/main/frameworks/React-v19.2.6.svg)
![](https://github.com/markus-grosshaeuser/badges/blob/main/tools/Vite-v8.0.12.svg)
![](https://github.com/markus-grosshaeuser/badges/blob/main/tools/npm-v11.13.0.svg)
![](https://github.com/markus-grosshaeuser/badges/blob/main/license-MIT.svg)
![](https://github.com/markus-grosshaeuser/badges/blob/main/tests/tc-985.svg)

CSV Compare is a React-based web application for comparing two CSV exports from different data sources.

The app is designed for scenarios where one CSV represents a source system, such as a database, and another CSV represents a target system, such as a cloud service. It determines which rows need to be inserted into the target system and which rows should be removed from it.

---

## Contents

- [Features](#features)
- [Quickstart with Docker](#quickstart-with-docker)
- [How It Works](#how-it-works)
- [CSV Input Requirements](#csv-input-requirements)
- [Deployment of the pre-build files](#deployment-of-the-pre-build-files)
- [Configuration](#configuration)
  - [CSV Template Configuration](#csv-template-configuration)
  - [Source and Target Display Configuration](#source-and-target-display-configuration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Building the Application](#building-the-application)
    - [Requirements](#requirements)
    - [Getting Started](#getting-started)
    - [Available Scripts](#available-scripts)
    - [Testing](#testing)
- [Internationalization](#internationalization)
- [Browser Behavior](#browser-behavior)
- [Development Notes](#development-notes)
- [License](#license)

---

## Features

- Upload two CSV files via drag-and-drop or file picker
- Compare source and target datasets using configurable column mappings
- Generate two synchronization CSV outputs:
    - rows to insert into the target system
    - rows to remove from the target system
- Download generated CSV results
- Configurable source and target names/icons
- Internationalization support for English and German
- Client-side processing
- Unit and component tests with Vitest and React Testing Library (RTL)
- Linting with ESLint
- Built with React, TypeScript, and Vite

---

## Quickstart with Docker

A `docker-compose.yaml` file is included in the project.

If docker compose is configured for your environment, you can start it with:

`docker compose up`

The application will be available at:

> http://localhost:8080

If you make changes to the Docker setup, rebuild the container with:

`bash docker compose up --build`

---

## How It Works

1. The user selects one CSV file from the source system and one from the target system.
2. The app validates both files against the configured CSV template/mapping.
3. The source data is transformed into the target structure.
4. The app compares both datasets using the configured primary key.
5. Two result files are generated:
    - insertions: records present in the source but missing in the target
    - deletions: records present in the target but missing in the source
6. The user can download both generated CSV files.

---

## CSV Input Requirements

The uploaded files should be valid CSV files.

The app expects that:

- both files contain a header row
- the required columns from the configured mapping are present
- the configured primary key columns exist
- rows can be uniquely compared using the configured primary key

Unsupported or mismatching files may result in a parsing or validation error.

---

## Deployment of the pre-build files

This application is a static frontend application. After building the project, the generated `dist/` directory contains all files required to run the app in a browser.

You can deploy the application without installing Node.js or running a build step by copying the contents of `dist/` to any static web server, for example:

- Nginx
- Apache HTTP Server
- ...
- any basic web hosting provider that can serve static files

The web server only needs to serve the files as static assets. No backend service is required for the normal CSV comparison workflow.

If you make changes to the source code, rebuild the application before deploying (refer to '[Building the Application](#building-the-application)' section).

Then upload the updated contents of the `dist/` directory to your web server.

---

## Configuration

### CSV Template Configuration

The CSV comparison is based on a template that defines:

- how source columns map to target columns
- which columns form the primary key

Basic Structure:

```json
{
    "column_match": [
        { "target": "value", "source": "value" },
        { "target": "value", "source": "value" }
    ],
    "primary_key": [
        { "target": "value", "source": "value" }
    ]
}
```

The most important aspect is that the header line from the target system determines the structure of the CSV template.

> Example:
> ```text
> Header from source system CSV:
>
>> UserName,LastName,FirstName,Email,PhoneNumber
> ```
> ```text
> Header from target system CSV:
>
>> FirstName,Surname,EmailAddress,Department
> ```
> Resulting CSV Template (using Surname/LastName and FirstName as a compound primary key):
>
> ```json
> {
>     "column_match": [
>         { "target": "FirstName", "source": "FirstName" },
>         { "target": "Surname", "source": "LastName" },
>         { "target": "EmailAddress", "source": "Email" },
>         { "target": "Department", "source": "" },
>         { "target": "", "source": "PhoneNumber" }
>     ],
>     "primary_key": [
>         { "target": "Surname", "source": "LastName" },
>         { "target": "FirstName", "source": "FirstName" }
>     ]
> }
> ```

A mapping entry with an empty `source` or `target` (e.g. `PhoneNumber` and `Department` in the above example) can be used to describe columns that only exist on one side.

The primary key mapping tells the application which source and target columns identify the same logical record.

This configuration can be changed in the production environment **without a rebuild**.

<br>

### Source and Target Display Configuration

The source and target labels/icons are configured in: `src/config/config.json`

Example:

```json
{
    "source": {
        "name": "Database",
        "icon": "/src/assets/database.svg"
    },
    "target": {
        "name": "Cloud",
        "icon": "/src/assets/cloud.svg"
    }
}
```

These values are used in the UI to describe the two compared systems.

Changing this configuration **requires a rebuild** of the application.

---

## Tech Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- React Redux
- React Router
- i18next / react-i18next
- PapaParse
- Vitest
- React Testing Library (RTL)
- ESLint
- Prettier

---

## Project Structure

```
csv_compare/
  ├── public/
  ├── src/
  │ ├── assets/
  │ ├── components/
  │ │ └── FileDropArea.tsx
  │ ├── config/
  │ │ ├── locales/
  │ │ │ ├── de/
  │ │ │ └── en/
  │ │ ├── config.json
  │ │ └── i18n.ts
  │ ├── pages/
  │ │ ├── DataSourceScreen.tsx
  │ │ └── DataSynchronizationScreen.tsx
  │ ├── redux/
  │ ├── utilities/
  │ │ ├── CsvParser.ts
  │ │ ├── CsvUtility.ts
  │ │ ├── FileDownloadProvider.ts
  │ │ └── InputDataValidator.ts
  │ ├── App.tsx
  │ └── main.tsx
  ├── test/
  │ ├── components/
  │ ├── pages/
  │ ├── utilities/
  │ └── setup.ts
  ├── docker-compose.yaml
  ├── eslint.config.js
  ├── package.json
  ├── tsconfig.json
  └── vite.config.ts
```

---

## Building the Application

### Requirements

- Node.js
- npm

This project uses npm as its package manager.

<br>

### Getting Started

#### 1. Clone the Repository

`git clone https://github.com/markus-grosshaeuser/csv-compare.git`

`cd csv-compare`

#### 2. Install Dependencies

`npm install`

#### 3. Start the Development Server

`npm run dev`

The application will be available at the local Vite development URL shown in your terminal, usually:

> http://localhost:5173

<br>

### Available Scripts

- Start Development Server
    - `npm run dev` Starts the Vite development server with hot module replacement.
- Build for Production
    - `npm run build` Runs the TypeScript build and creates a production build with Vite.
- Preview Production Build
    - `npm run preview` Serves the production build locally for verification.
- Run Tests
    - `npm test` Runs the Vitest test suite.
- Run Linting
    - `npm run lint` Runs ESLint for the project.

<br>

### Testing

The project uses:

- Vitest as the test runner
- React Testing Library for React component tests
- jest-dom matchers for DOM assertions
- jsdom as the browser-like test environment

Tests are located in the `test/` directory and cover:

- CSV parsing and comparison utilities
- input validation utilities
- file drop behavior
- data source selection flow
- synchronization result rendering and download behavior

Run all tests with:

`npm run test`

---

## Internationalization

The application uses `i18next` and `react-i18next`.

Translation files and the i18n.ts configuration file are stored in:

```
src/config/
  ├── i18n.ts
  └── locales/
    ├── de/
    │ └── translation.json
    └── en/
      └── translation.json
```

The current setup includes English and German translations.

`I18nextBrowserLanguageDetector` is used to automatically detect the user's preferred language from the browser settings.

---

## Browser Behavior

CSV files are loaded in the browser using object URLs. When a file is replaced, the previous object URL is revoked to avoid unnecessary memory usage.

The generated insertion and deletion files are downloaded directly from the browser.

---

## Development Notes

- The application is client-side and does not require a backend for normal CSV comparison.
- CSV parsing is handled with PapaParse.
- Application state is managed with Redux Toolkit.
- Routing is handled with React Router.
- Styling is done with CSS modules and shared theme variables.
- The project is intended to be type-safe and testable.

---

## License

### MIT

Copyright 2026 Markus Großhäuser

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
