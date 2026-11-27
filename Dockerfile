# SliceVid — YouTube Video Trimmer & Downloader
FROM node:20-slim

WORKDIR /app

# Install dependencies (this also downloads the ffmpeg & yt-dlp binaries
# via the ffmpeg-static / yt-dlp-exec post-install scripts).
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p tmp
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
