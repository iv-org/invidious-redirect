FROM node:14.5.0-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM nginx:alpine as app
COPY --from=build /app/build/ /usr/share/nginx/html/
