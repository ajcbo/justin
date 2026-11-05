FROM node:24-alpine
WORKDIR /app
COPY dist ./dist
COPY server/*.mjs ./server/
ENV HOST=0.0.0.0 PORT=8080 JUSTIN_DB=/data/game.sqlite
EXPOSE 8080
CMD ["node", "server/server.mjs"]
