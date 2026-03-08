FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
ENV NEXT_PUBLIC_API_URL=http://backend:4000/api
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "start"]
