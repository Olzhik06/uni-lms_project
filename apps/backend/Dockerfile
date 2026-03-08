FROM node:20-alpine

# bcrypt requires native compilation, prisma requires openssl
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN pnpm run build
RUN ls -la dist/

# Finalize image
EXPOSE 4000

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
