FROM node:14.5.0-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM nginx:alpine as app
# fix nginx root location
RUN sed -i 's|index  index.html index.htm;|try_files $uri /index.html;|g' /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/ /usr/share/nginx/html/
