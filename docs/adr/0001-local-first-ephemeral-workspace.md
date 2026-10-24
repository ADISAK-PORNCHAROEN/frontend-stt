# Keep the first version local and ephemeral

The app serves one person using an STT service on the same computer, so the first version keeps one transcription workspace in the open browser page and sends service requests through a same-origin Next.js proxy, with no account or durable history. This avoids adding identity and storage around the existing local service; the trade-off is that reloads or leaving the page lose job tracking and require a fresh upload.
