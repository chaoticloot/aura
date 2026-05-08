# Aura: Public Domain Art Explorer

Aura is a modern, responsive web application that aggregates and explores high-resolution, public domain, and CC-licensed artworks from the world's most prestigious museums and archives. 

## Features

* **Multi-Source Aggregation:** Searches across 6 major museum/art APIs simultaneously.
* **Smart Filtering:** Refine results by medium/technique (Oil Painting, Watercolor, Ink, etc.) and by time period (Before 20th Century, Renaissance, etc.).
* **Strict & Author Search:** Use "Strict Match" to narrow down exact terms or click an author's name to see only their works.
* **License Transparency:** Distinct badges and a License Guide help identify CC0 (Public Domain), CC BY-SA, and CC BY artworks.
* **Similar Works Discovery:** Viewing an artwork automatically suggests visually or thematically similar pieces.
* **High-Resolution Images:** View details up close and link out to the source archives for full-resolution downloads.

## Supported Museum APIs

Aura fetches data in real-time from the following open access collections:
* **The Metropolitan Museum of Art (The MET)**
* **Art Institute of Chicago (AIC)** (via IIIF Image API)
* **Cleveland Museum of Art (CMA)**
* **Statens Museum for Kunst (SMK - National Gallery of Denmark)**
* **Victoria and Albert Museum (V&A)**
* **Wikimedia Commons**

## Tech Stack

* **Frontend:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **Icons:** [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+ recommended) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aura-art-explorer.git
   cd aura-art-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app should now be running on `http://localhost:3000` (or another port specified by Vite).

## Deployment

This project is pre-configured to be deployed to **GitHub Pages**. 

When you push to the `main` or `master` branch, the included GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build the React app and deploy it to GitHub Pages.

To enable this:
1. Go to your repository settings on GitHub.
2. Navigate to **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**, ensure the **Source** is set to **GitHub Actions**.

## License

This project's code is open-source and available under the [MIT License](LICENSE). Note that the artworks fetched by the application are subject to their respective licenses (mostly CC0 or CC BY), as indicated in the application UI.
